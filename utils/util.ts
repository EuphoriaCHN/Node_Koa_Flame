import chalk from 'chalk';
import { LogStatus } from './constant';

namespace Utils {
  // 输出类型定义
  type Tlog = LogStatus | number;

  /**
   * 无用输出，给啥吐啥
   * @param arg 无用输入
   */
  const tmp = <T>(arg: T): T => arg;

  // 维护类型颜色映射表
  const loggerColorMap: { [k in LogStatus]: Function } = {
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    processing: chalk.cyan,
    note: chalk.grey,
  };

  /**
   * 输出某些信息
   * @param message 标准输出信息
   * @param mode 输出类型，可选 'success', 'warning', 'error', 'processing', 'note', 以及任意数字。默认是 'none'
   * @param checkSlice 如果需要被检查是否静默，则会返回一个回调
   */
  export function log(
    message: string,
    mode: Tlog = 'note',
    checkSlice: boolean = false
  ) {
    const modeString = '['.concat(String(mode).toUpperCase()).concat(']');

    let colorfulFunction = parseInt(String(mode))
      ? /* 是数字，直接输出 */ tmp
      : /* 不是数字，用颜色转换 */ loggerColorMap[mode as LogStatus];

    if (!colorfulFunction) {
      // default 情况
      // 比如 GET 或 POST
      colorfulFunction = chalk.greenBright;
    }

    const msg = `${colorfulFunction(modeString)}: ${message}`;

    if (checkSlice) {
      return function () {
        console.log(msg);
      };
    } else {
      console.log(msg);
    }
  }
}

export const logger = Utils.log;
