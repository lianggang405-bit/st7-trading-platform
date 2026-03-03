/**
 * 市场数据生成器
 *
 * 生成模拟的市场行情数据，用于降级和测试
 */

/**
 * 生成随机趋势（上涨/下跌）
 */
export function getRandomTrend(): 'up' | 'down' | 'flat' {
  const rand = Math.random();
  if (rand < 0.4) return 'up';
  if (rand < 0.8) return 'down';
  return 'flat';
}

/**
 * 生成随机涨跌幅（-10% 到 +10%）
 */
export function getRandomChange(): number {
  // 使用正态分布近似（Box-Muller 变换）
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  // 标准差 2%（通常涨跌幅在 ±6% 范围内）
  const stdDev = 0.02;
  const change = z * stdDev;

  // 限制在 -10% 到 +10% 范围内
  return Math.max(-0.1, Math.min(0.1, change));
}

/**
 * 生成随机价格（基于基准价格）
 *
 * @param basePrice 基准价格
 * @returns 随机价格
 */
export function getRandomPrice(basePrice: number): number {
  const change = getRandomChange();
  return basePrice * (1 + change);
}

/**
 * 生成随机成交量
 */
export function getRandomVolume(baseVolume: number): number {
  const factor = 0.5 + Math.random() * 1.0; // 0.5x 到 1.5x
  return baseVolume * factor;
}
