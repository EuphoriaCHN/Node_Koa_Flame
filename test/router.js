const {
  Router
} = require('../dist/index');

const router = new Router();

router.get('/', async ctx => {
  // controller
  return ctx.body = 'Hello';
});

module.exports = router;