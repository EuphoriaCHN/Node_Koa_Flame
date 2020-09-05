/**
 * 项目配置文件
 */

const path = require('path');

const _ROOT_PATH = path.resolve(__dirname, '../');

const BASE_CONFIG = {
  ROOT_PATH: _ROOT_PATH,
  SOURCE_PATH: path.resolve(_ROOT_PATH, 'app'),
  NODE_MODULES: path.resolve(_ROOT_PATH, 'node_modules')
};

const MVC_CONFIG = {
  CONTROLLER_PATH: path.resolve(BASE_CONFIG.SOURCE_PATH, 'controller'),
  SERVICE_PATH: path.resolve(BASE_CONFIG.SOURCE_PATH, 'service'),
  MODEL_PATH: path.resolve(BASE_CONFIG.SOURCE_PATH, 'model'),
};

module.exports = Object.assign({}, BASE_CONFIG, MVC_CONFIG);