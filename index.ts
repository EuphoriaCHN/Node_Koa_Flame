import Koa from 'koa';
import { Options } from 'sequelize';
import KoaBodyPaser from 'koa-bodyparser';
import KoaStatic from 'koa-static';
import KoaViews from 'koa-views';

import fs from 'fs';
import path from 'path';
import { Server } from 'http';

import { logger } from './utils/util';
import ORM from './lib/orm';
import RouterClass from './lib/router';

import {
  HTTP_STATUS_CODE,
  STATUS_CODE,
  PROJECT_MODULE_PATH,
  setProjectModelPath,
} from './utils/constant';

namespace NS {
  // 定义 MVC 模块类型
  export type IMVCMode = 'controller' | 'model' | 'service';

  // 定义 MVC 模块数据结构
  type IMVCStructure = {
    path: string | null; // 存储路径
  };

  // 静默消息通知数据结构
  type Slice = {
    message?: boolean; // 普通通知，如 [PROCESSING]: 正在绑定 controller 模块...
    databaseLog?: boolean; // ORM 通知，即 Sequelize logger
    requestLog?: boolean; // 请求时 log 日志
  };

  // constructor 定义
  type IEuphoriaNode = {
    checkModuleStrict?: boolean; // 如果是 true，则会严格检查 MVC 模块下是否会有文件
    staticPath?: string; // 传入 koa-static，默认 /static
    viewPath?: string; // 传入 koa-view，默认 /static/dist
    // 传入 Koa-views 的参数
    viewOpts?: {
      autoRender?: boolean;
      extension?: string;
      options?: any;
      map?: any;
      engineSource?: any;
    };
  };

  // listen 第二个配置参数结构定义
  // koa listen 第二个参数没有 object，所以可以进行扩展并判断
  type ListenOptions = {
    autoLinkMVC?: boolean;
  };

  /**
   * 主类
   */
  export class EuphoriaNode extends Koa {
    private mvcConfig: {
      controller: IMVCStructure;
      model: IMVCStructure;
      service: IMVCStructure;
    };

    // 输出静默
    private slice: boolean | Slice;
    // 严格检查 MVC 模块文件
    private readonly checkModuleStrict: boolean;

    // ORM 实例
    public orm: ORM;

    // Router 实例
    public static Router = RouterClass;

    constructor(options: IEuphoriaNode = {}) {
      super();

      // middleware
      this.use(KoaBodyPaser());
      // koa-static 默认指向 /static 目录
      this.use(KoaStatic(options.staticPath || PROJECT_MODULE_PATH.STATIC));
      // koa-view 默认指向 /static/dist 目录
      // todo:: 用 router 去渲染模板
      this.use(
        KoaViews(options.viewPath || PROJECT_MODULE_PATH.VIEW, options.viewOpts)
      );

      // request log
      this.use(this.requestLog);

      this.checkModuleStrict = Boolean(options.checkModuleStrict);
      this.mvcConfig = {
        controller: { path: null },
        model: { path: null },
        service: { path: null },
      };
      this.slice = false;
      this.orm = null;
    }

    /**
     * 封装请求信息日志
     * todo:: Response 日志
     * @param ctx Koa.ExtendableContext
     * @param next Koa.Next
     */
    private async requestLog(ctx: Koa.ExtendableContext, next: Koa.Next) {
      const { method, path, ip } = ctx.request;

      (ctx.app as EuphoriaNode).sliceLog(
        logger(`${ip} ${path}`, method as any, true),
        'message'
      );

      try {
        await next();
      } catch (error) {
        // 底层抛错
        ctx.response.status = HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR;
        return (ctx.body = {
          status_code: STATUS_CODE.COMMON_ERROR,
          message: error.message || JSON.stringify(error),
        });
      }
    }

    /**
     * 判断是否应当打印某个日志
     * @param message 打印的字符串，如果是函数则表示一个回调
     * @param type 打印类型，默认是 message 通知
     * @returns 如果是 true 表示此消息静默
     */
    private sliceLog(
      message: string | Function | null,
      type: keyof Slice = 'message'
    ) {
      if (this.slice === true) {
        // 静默所有通知
        return true;
      }
      if (typeof this.slice === 'object') {
        if ((this.slice as Slice)[type]) {
          // 某个消息被静默了
          return true;
        }
      }
      if (message !== null) {
        if (typeof message === 'string') {
          console.log(message);
        } else {
          message();
        }
      }
      return false;
    }

    /**
     * 设置消息静默方式
     * @param option 配置参数
     */
    setSlice(option: boolean | Slice): EuphoriaNode {
      if (typeof option === 'boolean') {
        this.slice = option;
      } else {
        this.slice = Object.assign({}, option);
      }

      return this;
    }

    /**
     * 修改模块文件路径
     *
     * 可供修改的项：
     * - ROOT: 项目根路径，默认是 <code>/</code>（和 package.json 同级）
     * - APP: app 文件路径，默认是 <code>ROOT/app</code>
     * - STATIC: 静态资源路径，默认是 <code>ROOT/static</code>
     * - VIEW: 模板路径，默认是 <code>ROOT/static/dist</code>
     *
     * 可以不传参数，代表 <b>恢复初始化</b>
     *
     * @param options 路径配置项
     */
    setProjectModelPath(options: Partial<typeof PROJECT_MODULE_PATH> = {}) {
      setProjectModelPath(options);
    }

    /**
     * 创建 ORM 实例
     * @param options Sequelize 配置项
     */
    createORM(options: Options): EuphoriaNode {
      const LOGER_OPTIONS: Partial<Options> = {
        logging: this.sliceLog(null, 'databaseLog'),
      };

      this.orm = new ORM(
        Object.assign(LOGER_OPTIONS, ORM.DEFAULT_OPTIONS, options)
      );

      return this;
    }

    /**
     * 绑定 Model、Controller 或 Service 目录，为自动解析做准备
     * @param key 指定 MVC 模块类型
     * @param value 指定路径，这个路径必须存在
     */
    bindMVCDir(options: { [key in IMVCMode]?: string }): EuphoriaNode {
      Object.keys(options).forEach((mode) => {
        const _path = options[mode];

        this.sliceLog(
          logger(
            `正在绑定 ${mode} 模块: ${path.relative(
              PROJECT_MODULE_PATH.ROOT,
              _path
            )}`,
            'processing',
            true
          )
        );

        // 检测文件夹是否存在
        if (!fs.existsSync(_path)) {
          throw new Error(
            `指定的 ${mode} 路径 ${_path} 不存在于当前计算机上！请检查！`
          );
        }

        // 获取文件夹内容
        const filesInModelDir = fs
          .readdirSync(_path)
          .filter((filename) => /\.[jt]s$/.test(filename)); // 只筛选 .js .ts 模块

        // 判断文件夹是否为空
        if (this.checkModuleStrict && !filesInModelDir.length) {
          throw new Error(
            `指定的路径为 ${_path} 的 ${mode} 模块下没有任何模块文件，请检查！\n我们仅默认 .js .ts 为模块文件！`
          );
        }

        // 设置路径
        this.mvcConfig[mode].path = _path;

        this.sliceLog(logger(`绑定 ${mode} 模块成功！`, 'success', true));
      });

      return this;
    }

    /**
     * 自动绑定 Model、Controller 或 Service 目录
     * 即 <code>bindMVCDir</code> 的懒人版本
     * 默认路径如下：
     * - /app/controller
     * - /app/model
     * - /app/service
     */
    autoBindMVCDir(): EuphoriaNode {
      function getPathResult(moduleName: IMVCMode) {
        return path.resolve(PROJECT_MODULE_PATH.APP, moduleName);
      }

      this.bindMVCDir({
        controller: getPathResult('controller'),
        service: getPathResult('service'),
        model: getPathResult('model'),
      });

      return this;
    }

    listen(
      port?: number,
      hostname?: string,
      backlog?: number,
      listeningListener?: () => void
    ): Server;
    listen(
      port: number,
      hostname?: string,
      listeningListener?: () => void
    ): Server;
    listen(
      port: number,
      backlog?: number,
      listeningListener?: () => void
    ): Server;
    listen(port: number, listeningListener?: () => void): Server;
    listen(
      path: string,
      backlog?: number,
      listeningListener?: () => void
    ): Server;
    listen(path: string, listeningListener?: () => void): Server;
    listen(options: ListenOptions, listeningListener?: () => void): Server;
    listen(
      handle: any,
      backlog?: number,
      listeningListener?: () => void
    ): Server;
    listen(handle: any, listeningListener?: () => void): Server;

    // 将自动绑定放到 options 上
    // KOA 自带的 listen 第二个参数不可能是 Object，所以可以进行判断
    listen(
      port: number,
      options?: ListenOptions,
      listeningListener?: () => void
    ): Server;

    listen(...args) {
      if (args[1] && typeof args[1] === 'object') {
        if ((args[1] as ListenOptions).autoLinkMVC) {
          // 自动绑定 MVC 模块
          this.autoBindMVCDir();
        }
        const _firstArg = args.shift();
        // 移除掉第二个
        args.shift();
        // 加回第一个
        args.unshift(_firstArg);
      } else {
        // 遍历 this.mvcConfig，给予用户警告【未绑定的 MVC 模块】
        Object.keys(this.mvcConfig).forEach((moduleName) => {
          const { path } = this.mvcConfig[moduleName as IMVCMode];
          if (!path) {
            this.sliceLog(
              logger(`${moduleName} 模块没有被绑定，不会自动解析！`, 'warning')
            );
          }
        });
      }

      // 如果当前有数据库 ORM 实例
      if (this.orm) {
        // 进行数据库连接
        this.orm.connect(this.sliceLog(null, 'databaseLog'));
      }

      // 获取最后一个参数，看看是不是回调函数
      const optionalListenCallback = args[args.length - 1];

      // 获取第一个参数，看看是不是端口号
      const port = args[0];

      // 重写回调
      const listenCallback = () => {
        const msg =
          typeof port === 'number'
            ? `服务在 ${port} 端口上启动成功`
            : '服务启动成功';

        this.sliceLog(logger(msg, 'success', true), 'message');

        if (typeof optionalListenCallback === 'function') {
          optionalListenCallback();
        }
      };

      if (typeof optionalListenCallback === 'function') {
        args[args.length - 1] = listenCallback;
      } else {
        args[args.length] = listenCallback;
      }

      return super.listen(...args);
    }
  }
}

export = NS.EuphoriaNode;
