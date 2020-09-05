import Global = NodeJS.Global;

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

export interface EuphoriaGlobal extends Global {
  STATUS_CODE: typeof STATUS_CODE;
  HTTP_STATUS_CODE: typeof HTTP_STATUS_CODE;
}
