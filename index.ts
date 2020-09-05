import Koa from 'koa';
import { Options } from 'sequelize';
import KoaBodyPaser from 'koa-bodyparser';
import KoaStatic from 'koa-static';

import fs from 'fs';
import path from 'path';
import { Server } from 'http';
import { ListenOptions } from 'net';

import { logger } from './utils/util';
import ORM from './lib/orm';
import * as G from './lib/global';

declare const globalThis: G.EuphoriaGlobal;
globalThis.STATUS_CODE = G.STATUS_CODE;
globalThis.HTTP_STATUS_CODE = G.HTTP_STATUS_CODE;

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
    staticPath?: string; // 传入 koa-static
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
    public ormInstance: ORM;

    constructor(options: IEuphoriaNode = {}) {
      super();

      // middleware
      this.use(KoaBodyPaser());
      // koa-static 默认指向 /static 目录
      this.use(
        KoaStatic(options.staticPath || path.resolve(__dirname, 'static'))
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
      this.ormInstance = null;
    }

    /**
     * 封装请求信息日志
     * @param ctx Koa.ExtendableContext
     * @param next Koa.Next
     */
    private async requestLog(ctx: Koa.ExtendableContext, next: Koa.Next) {
      await next();
    }

    /**
     * 判断是否应当打印某个日志
     * @param {string | Function} message 打印的字符串，如果是函数则表示一个回调
     * @param {keyof Slice} type 打印类型，默认是 message 通知
     * @returns {boolean} 如果是 true 表示此消息静默
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
    setSlice(option: boolean | Slice) {
      if (typeof option === 'boolean') {
        this.slice = option;
      } else {
        this.slice = Object.assign({}, option);
      }
    }

    /**
     * 创建 ORM 实例
     * @param options Sequelize 配置项
     */
    createORM(options: Options) {
      const LOGER_OPTIONS: Partial<Options> = {
        logging: this.sliceLog(null, 'databaseLog'),
      };

      this.ormInstance = new ORM(
        Object.assign(LOGER_OPTIONS, ORM.DEFAULT_OPTIONS, options)
      );
    }

    /**
     * 绑定 Model、Controller 或 Service 目录，为自动解析做准备
     * @param key 指定 MVC 模块类型
     * @param value 指定路径，这个路径必须存在
     */
    bindMVCDir(options: { [key in IMVCMode]?: string }): void {
      Object.keys(options).forEach((mode) => {
        this.sliceLog(logger(`正在绑定 ${mode} 模块...`, 'processing', true));

        const path = options[mode];

        // 检测文件夹是否存在
        if (!fs.existsSync(path)) {
          throw new Error(
            `指定的 ${mode} 路径 ${path} 不存在于当前计算机上！请检查！`
          );
        }

        // 获取文件夹内容
        const filesInModelDir = fs
          .readdirSync(path)
          .filter((filename) => /\.[jt]s$/.test(filename)); // 只筛选 .js .ts 模块

        // 判断文件夹是否为空
        if (this.checkModuleStrict && !filesInModelDir.length) {
          throw new Error(
            `指定的路径为 ${path} 的 ${mode} 模块下没有任何模块文件，请检查！\n我们仅默认 .js .ts 为模块文件！`
          );
        }

        // 设置路径
        this.mvcConfig[mode].path = path;

        this.sliceLog(logger(`绑定 ${mode} 模块成功！`, 'success', true));
      });
    }

    /**
     * 自动绑定 Model、Controller 或 Service 目录
     * 即 <code>bindMVCDir</code> 的懒人版本
     * 默认路径如下：
     * - /app/controller
     * - /app/model
     * - /app/service
     * @param _path 兜底路径，当 cwd() 和 env.PWD 都拿不到时，就用它，否则抛出异常
     */
    autoBindMVCDir(_path = null) {
      let userPath: string | null = null;

      if (process.cwd) {
        userPath = process.cwd();
      } else if (process.env.PWD) {
        userPath = process.env.PWD;
      } else if (_path) {
        userPath = _path;
      } else {
        throw new Error(
          '无法解析用户当前根路径，尝试给予该方法一个参数？代表兜底路径'
        );
      }

      function getPathResult(moduleName: IMVCMode) {
        return path.resolve(userPath, 'app', moduleName);
      }

      this.bindMVCDir({
        controller: getPathResult('controller'),
        service: getPathResult('service'),
        model: getPathResult('model'),
      });
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

    // 将自动绑定放到 handle 上
    listen(handle: any, listeningListener?: () => void): Server;

    listen(...args) {
      if (typeof args[0] === 'boolean') {
        // 自动绑定 MVC 模块
        this.autoBindMVCDir();
        args.shift(); // 去掉第一个参数，其余的传入 super
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
      if (this.ormInstance) {
        // 进行数据库连接
        this.ormInstance.connect(this.sliceLog(null, 'databaseLog'));
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

      if (typeof listenCallback === 'function') {
        args[args.length - 1] = listenCallback;
      } else {
        args[args.length] = listenCallback;
      }

      return super.listen(...args);
    }
  }
}

export = NS.EuphoriaNode;
