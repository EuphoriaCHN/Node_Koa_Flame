const WqhNode = require('../dist/index');

const app = new WqhNode();

app.use(() => {
  console.log('yes!');
  return async function (ctx, next) {
    await next();
  }
});

app
  .createORM(require('./config/orm.config'))
  .listen(3000, {
    autoLinkMVC: true
  });