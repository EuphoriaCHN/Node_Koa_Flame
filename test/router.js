const Router = require('../dist/lib/router');

const router = new Router();

router.get('/', async ctx => {
  // controller
  return ctx.body = 'Hello';
});