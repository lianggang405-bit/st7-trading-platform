/**
 * 唯一行情引擎
 * 所有交易对的价格都从这里产生
 * 每个交易对使用独立随机种子，确保独立波动
 */

export type SymbolData = {
  symbol: string
  price: number
  base: number
  category: 'crypto' | 'metal' | 'forex' | 'energy' | 'cfd'
}

// 所有交易对的初始数据
const symbols: Record<string, SymbolData> = {
  // 加密货币
  BTCUSDT: { symbol: "BTCUSDT", price: 62000, base: 62000, category: 'crypto' },
  ETHUSDT: { symbol: "ETHUSDT", price: 3200, base: 3200, category: 'crypto' },
  LTCUSDT: { symbol: "LTCUSDT", price: 150, base: 150, category: 'crypto' },
  SOLUSDT: { symbol: "SOLUSDT", price: 200, base: 200, category: 'crypto' },
  XRPUSDT: { symbol: "XRPUSDT", price: 0.6, base: 0.6, category: 'crypto' },
  DOGEUSDT: { symbol: "DOGEUSDT", price: 0.2, base: 0.2, category: 'crypto' },
  ADAUSDT: { symbol: "ADAUSDT", price: 1.2, base: 1.2, category: 'crypto' },
  DOTUSDT: { symbol: "DOTUSDT", price: 8, base: 8, category: 'crypto' },

  // 贵金属
  XAUUSD: { symbol: "XAUUSD", price: 5200, base: 5200, category: 'metal' },
  XAGUSD: { symbol: "XAGUSD", price: 29.5, base: 29.5, category: 'metal' },

  // 外汇
  EURUSD: { symbol: "EURUSD", price: 1.085, base: 1.085, category: 'forex' },
  GBPUSD: { symbol: "GBPUSD", price: 1.265, base: 1.265, category: 'forex' },
  USDJPY: { symbol: "USDJPY", price: 149.8, base: 149.8, category: 'forex' },
  USDCHF: { symbol: "USDCHF", price: 0.884, base: 0.884, category: 'forex' },
  AUDUSD: { symbol: "AUDUSD", price: 0.655, base: 0.655, category: 'forex' },
  NZDUSD: { symbol: "NZDUSD", price: 0.609, base: 0.609, category: 'forex' },
  USDCAD: { symbol: "USDCAD", price: 1.366, base: 1.366, category: 'forex' },
  EURGBP: { symbol: "EURGBP", price: 0.859, base: 0.859, category: 'forex' },
  EURJPY: { symbol: "EURJPY", price: 162.5, base: 162.5, category: 'forex' },
  GBPJPY: { symbol: "GBPJPY", price: 189.5, base: 189.5, category: 'forex' },
  AUDJPY: { symbol: "AUDJPY", price: 98.2, base: 98.2, category: 'forex' },
  CADJPY: { symbol: "CADJPY", price: 110.5, base: 110.5, category: 'forex' },
  CHFJPY: { symbol: "CHFJPY", price: 169.5, base: 169.5, category: 'forex' },

  // 能源
  USOIL: { symbol: "USOIL", price: 85, base: 85, category: 'energy' },
  UKOIL: { symbol: "UKOIL", price: 87.8, base: 87.8, category: 'energy' },
  NGAS: { symbol: "NGAS", price: 2.8, base: 2.8, category: 'energy' },

  // 指数
  US500: { symbol: "US500", price: 5200, base: 5200, category: 'cfd' },
  ND100: { symbol: "ND100", price: 18500, base: 18500, category: 'cfd' },
  AUS200: { symbol: "AUS200", price: 7807, base: 7807, category: 'cfd' },
  UK100: { symbol: "UK100", price: 8098, base: 8098, category: 'cfd' },
  GER40: { symbol: "GER40", price: 17814, base: 17814, category: 'cfd' },
  JPN225: { symbol: "JPN225", price: 40034, base: 40034, category: 'cfd' },
}

/**
 * 每个交易对的波动率配置
 * 越大的资产波动越大，外汇波动最小
 */
const volatilityMap: Record<string, number> = {
  // 加密货币（大波动 0.2%）
  BTCUSDT: 0.002,
  ETHUSDT: 0.002,
  LTCUSDT: 0.0025,
  SOLUSDT: 0.003,
  XRPUSDT: 0.003,
  DOGEUSDT: 0.004,
  ADAUSDT: 0.003,
  DOTUSDT: 0.003,

  // 贵金属（中等波动）
  XAUUSD: 0.0008,  // 黄金
  XAGUSD: 0.0015,  // 白银

  // 外汇（小波动）
  EURUSD: 0.0002,
  GBPUSD: 0.0003,
  USDJPY: 0.0003,
  USDCHF: 0.00025,
  AUDUSD: 0.00025,
  NZDUSD: 0.00025,
  USDCAD: 0.00025,
  EURGBP: 0.0002,
  EURJPY: 0.00025,
  GBPJPY: 0.0003,
  AUDJPY: 0.0003,
  CADJPY: 0.0003,
  CHFJPY: 0.0003,

  // 能源（中等波动）
  USOIL: 0.001,
  UKOIL: 0.001,
  NGAS: 0.002,

  // 指数（小波动）
  US500: 0.0003,
  ND100: 0.0004,
  AUS200: 0.0004,
  UK100: 0.0004,
  GER40: 0.0004,
  JPN225: 0.0005,
}

/**
 * 计算下一个价格（连续价格模型）
 *
 * 关键修复：
 * - 新价格 = 旧价格 + 微小波动（不是从 base 重新计算）
 * - 每个交易对使用独立波动率
 * - 添加最大跳动限制，防止断崖式跳变
 * - 限制价格范围（base 的 95%-105%）
 */
function nextPrice(data: SymbolData): number {
  // 获取该交易对的波动率
  const volatilityRate = volatilityMap[data.symbol] || 0.001

  // 计算波动幅度
  const volatility = data.base * volatilityRate

  // 随机波动（-50% 到 +50% 的波动幅度）
  const random = (Math.random() - 0.5) * volatility

  // 计算新价格（连续变化：新价格 = 旧价格 + 微小波动）
  let price = data.price + random

  // 最大跳动限制（防止断崖式跳变）
  const maxStep = volatility * 0.5  // 最大跳动为波动幅度的 50%
  const priceDiff = price - data.price

  if (Math.abs(priceDiff) > maxStep) {
    // 如果跳动超过限制，强制限制在最大跳动范围内
    price = data.price + Math.sign(priceDiff) * maxStep
  }

  // 防止价格漂移过远（限制在 base 的 95%-105%）
  const maxPrice = data.base * 1.05
  const minPrice = data.base * 0.95

  if (price > maxPrice) {
    price = maxPrice
  } else if (price < minPrice) {
    price = minPrice
  }

  // 根据价格精度返回结果
  // 小于 1 的资产保留 4 位小数，其他保留 2 位
  const decimals = data.base < 1 ? 4 : 2

  return Number(price.toFixed(decimals))
}

/**
 * 更新所有交易对价格
 * 每秒调用一次
 */
export function updateMarket(): Record<string, SymbolData> {
  Object.values(symbols).forEach((s) => {
    s.price = nextPrice(s)
  })

  return symbols
}

/**
 * 获取当前市场数据
 */
export function getMarket(): Record<string, SymbolData> {
  return symbols
}

/**
 * 获取单个交易对价格
 */
export function getSymbolPrice(symbol: string): number | undefined {
  return symbols[symbol]?.price
}
