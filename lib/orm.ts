import { Sequelize, Options } from 'sequelize';

import { logger } from '../utils/util';

namespace ORM {
  export class EuphoriaSequelize extends Sequelize {
    constructor(options?: Options) {
      super(options);
    }

    public static DEFAULT_OPTIONS: Partial<Options> = {
      host: 'localhost',
      port: 3306,
      dialect: 'mysql',
      omitNull: true,
      pool: {
        max: 5,
        idle: 30000,
        acquire: 60000,
      },
    };

    /**
     * 开始连接数据库
     */
    async connect(slice: boolean = true) {
      if (!slice) {
        console.log(logger('正在连接数据库...', 'processing'));
      }
      try {
        await this.authenticate();
        console.log(logger('数据库连接成功', 'success'));
      } catch (err) {
        console.log(logger('数据库连接失败', 'error'));
        console.error(err);
        process.exit(-1);
      }
    }
  }
}

export = ORM.EuphoriaSequelize;
