import KoaRouter from 'koa-router';

namespace NRouter {
  export class Router extends KoaRouter {
    constructor() {
      super();
    }
  }
}

export = NRouter.Router;
