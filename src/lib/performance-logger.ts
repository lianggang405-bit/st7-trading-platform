/**
 * 性能日志工具
 * 用于测量和记录函数执行时间
 */

export class PerformanceLogger {
  private startTime: number;
  private checkpoints: Map<string, number>;

  constructor() {
    this.startTime = Date.now();
    this.checkpoints = new Map();
  }

  /**
   * 记录检查点
   * @param name 检查点名称
   */
  checkpoint(name: string): void {
    this.checkpoints.set(name, Date.now());
  }

  /**
   * 获取从开始到当前的时间
   * @returns 毫秒
   */
  getElapsed(): number {
    return Date.now() - this.startTime;
  }

  /**
   * 获取从检查点到当前的时间
   * @param name 检查点名称
   * @returns 毫秒
   */
  getElapsedSince(name: string): number {
    const checkpointTime = this.checkpoints.get(name);
    if (!checkpointTime) {
      return 0;
    }
    return Date.now() - checkpointTime;
  }

  /**
   * 打印性能报告
   */
  printReport(): void {
    console.log(`[Performance] Total time: ${this.getElapsed()}ms`);
    this.checkpoints.forEach((time, name) => {
      const elapsed = time - this.startTime;
      console.log(`[Performance] ${name}: +${elapsed}ms`);
    });
  }

  /**
   * 获取性能报告作为对象
   */
  getReport(): Record<string, number> {
    const report: Record<string, number> = {
      total: this.getElapsed(),
    };

    this.checkpoints.forEach((time, name) => {
      const elapsed = time - this.startTime;
      report[name] = elapsed;
    });

    return report;
  }
}

/**
 * 创建一个性能测量装饰器
 * @param name 操作名称
 */
export function measurePerformance(name: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const logger = new PerformanceLogger();
      logger.checkpoint('start');

      try {
        const result = await originalMethod.apply(this, args);
        logger.checkpoint('end');
        logger.printReport();
        return result;
      } catch (error) {
        logger.checkpoint('error');
        logger.printReport();
        throw error;
      }
    };

    return descriptor;
  };
}
