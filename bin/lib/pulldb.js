const SequelizeAuto = require('sequelize-auto');
const assert = require('assert');
const path = require('path');
const chalk = require('chalk');

module.exports = async (userConfig) => {
  return new Promise((resolve, reject) => {
    const ROOT_DIR = process.env.INIT_CWD || __dirname;

    const DEFAULT_OPTIONS = {
      // 默认输出路径是 /app/model
      directory: path.resolve(ROOT_DIR, 'app', 'model'),
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
    };

    const config = Object.assign({}, DEFAULT_OPTIONS, userConfig);

    console.log(chalk.gray('\n[LOG]').concat(' 项目根路径：').concat(ROOT_DIR));
    console.log(
      chalk.gray('[LOG]').concat(' 输出路径：').concat(config.directory)
    );

    const {
      database,
      username,
      password
    } = config;

    assert(database, '获取数据库失败，请检查 config.database 配置！');
    assert(username, '获取数据库失败，请检查 config.username 配置！');
    assert(password, '获取数据库失败，请检查 config.password 配置！');

    const sequelizeAuto = new SequelizeAuto(
      database,
      username,
      password,
      config
    );

    sequelizeAuto.run((err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
};