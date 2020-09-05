import KoaRouter from 'koa-router';

namespace NRouter {
  export declare class Router extends KoaRouter {
    happy(text: string): void;
  }
}

export = NRouter.Router;
