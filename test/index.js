const WqhNode = require('../dist/index');
const Router = require('./router');

const app = new WqhNode();

app.use(Router.routes());

app
  .createORM(require('./config/orm.config'))
  .listen(3000, {
    autoLinkMVC: true
  });