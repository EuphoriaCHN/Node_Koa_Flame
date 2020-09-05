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

const ROOT_PATH = path.resolve(__dirname, '..');
const STATIC_PATH = path.resolve(ROOT_PATH, 'static');
const VIEW_PATH = path.resolve(STATIC_PATH, 'dist');

export const PROJECT_MODULE_PATH = {
  ROOT: ROOT_PATH,
  STATIC: STATIC_PATH,
  VIEW: VIEW_PATH,
};

export type LogStatus = 'success' | 'warning' | 'error' | 'processing' | 'note';
