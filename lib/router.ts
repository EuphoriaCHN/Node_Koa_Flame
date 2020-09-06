import KoaRouter from 'koa-router';
import EuphoriaNode from '../index';
import { ExtendableContext, Next } from 'koa';

namespace NRouter {
  export type HTTP_METHODS = 'get' | 'post' | 'head' | 'delete' | 'link' | 'unlink' | 'put' | 'options' | 'patch' | 'all';

  export type Routes = {
    method?: HTTP_METHODS,
    to: <T = any>(ctx: ExtendableContext, next?: Next) => Promise<T>
  };

  type RouterOptions = {
    app: EuphoriaNode,
    routes: {}
  };

  export class Router extends KoaRouter {
    constructor(options?: RouterOptions) {
      super();

      if (!options) {
        return;
      }
    }
  }
}

export = NRouter.Router;
