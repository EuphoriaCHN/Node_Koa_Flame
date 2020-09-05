/**
 * 定义常量
 */

import path from 'path';

export enum STATUS_CODE {
  SUCCESS = 1000,
  COMMON_ERROR = 1001,
}

export enum HTTP_STATUS_CODE {
  OK = 200,
  MOVED_PERMANENTLY = 301,
  MOVE_TEMPORARILY = 302,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export const PROJECT_MODULE_PATH = {
  ROOT: '',
  STATIC: '',
  VIEW: '',
  APP: '',
};

/**
 * 支持个性化配置项目重要模块路径，不写参数代表初始化（或恢复初始化
 * @param option 各个路径配置项
 */
export function setProjectModelPath(
  option: Partial<typeof PROJECT_MODULE_PATH> = {}
): void {
  PROJECT_MODULE_PATH.ROOT =
    option.ROOT ||
    (process.cwd && process.cwd()) ||
    process.env.PWD ||
    __dirname;
  PROJECT_MODULE_PATH.STATIC =
    option.STATIC || path.resolve(PROJECT_MODULE_PATH.ROOT, 'static');
  PROJECT_MODULE_PATH.VIEW =
    option.VIEW || path.resolve(PROJECT_MODULE_PATH.STATIC, 'dist');
  PROJECT_MODULE_PATH.APP =
    option.APP || path.resolve(PROJECT_MODULE_PATH.ROOT, 'app');
}

setProjectModelPath();

export type LogStatus = 'success' | 'warning' | 'error' | 'processing' | 'note';
