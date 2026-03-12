/**
 * 唯一行情引擎
 * 所有交易对的价格都从这里产生
 * 每个交易对使用独立随机种子，确保独立波动
 */

export type SymbolData = {
  symbol: string
  price: number
  base: number
  seed: number
  category: 'crypto' | 'metal' | 'forex' | 'energy' | 'cfd'
}

// 所有交易对的初始数据
const symbols: Record<string, SymbolData> = {
  // 加密货币
  BTCUSDT: { symbol: "BTCUSDT", price: 62000, base: 62000, seed: 1, category: 'crypto' },
  ETHUSDT: { symbol: "ETHUSDT", price: 3200, base: 3200, seed: 2, category: 'crypto' },
  LTCUSDT: { symbol: "LTCUSDT", price: 150, base: 150, seed: 3, category: 'crypto' },
  SOLUSDT: { symbol: "SOLUSDT", price: 200, base: 200, seed: 4, category: 'crypto' },
  XRPUSDT: { symbol: "XRPUSDT", price: 0.6, base: 0.6, seed: 5, category: 'crypto' },
  DOGEUSDT: { symbol: "DOGEUSDT", price: 0.2, base: 0.2, seed: 6, category: 'crypto' },
  ADAUSDT: { symbol: "ADAUSDT", price: 1.2, base: 1.2, seed: 7, category: 'crypto' },
  DOTUSDT: { symbol: "DOTUSDT", price: 8, base: 8, seed: 8, category: 'crypto' },

  // 贵金属
  XAUUSD: { symbol: "XAUUSD", price: 5200, base: 5200, seed: 10, category: 'metal' },
  XAGUSD: { symbol: "XAGUSD", price: 29.5, base: 29.5, seed: 11, category: 'metal' },

  // 外汇
  EURUSD: { symbol: "EURUSD", price: 1.085, base: 1.085, seed: 20, category: 'forex' },
  GBPUSD: { symbol: "GBPUSD", price: 1.265, base: 1.265, seed: 21, category: 'forex' },
  USDJPY: { symbol: "USDJPY", price: 149.8, base: 149.8, seed: 22, category: 'forex' },
  USDCHF: { symbol: "USDCHF", price: 0.884, base: 0.884, seed: 23, category: 'forex' },
  AUDUSD: { symbol: "AUDUSD", price: 0.655, base: 0.655, seed: 24, category: 'forex' },
  NZDUSD: { symbol: "NZDUSD", price: 0.609, base: 0.609, seed: 25, category: 'forex' },
  USDCAD: { symbol: "USDCAD", price: 1.366, base: 1.366, seed: 26, category: 'forex' },
  EURGBP: { symbol: "EURGBP", price: 0.859, base: 0.859, seed: 27, category: 'forex' },
  EURJPY: { symbol: "EURJPY", price: 162.5, base: 162.5, seed: 28, category: 'forex' },
  GBPJPY: { symbol: "GBPJPY", price: 189.5, base: 189.5, seed: 29, category: 'forex' },
  AUDJPY: { symbol: "AUDJPY", price: 98.2, base: 98.2, seed: 30, category: 'forex' },
  CADJPY: { symbol: "CADJPY", price: 110.5, base: 110.5, seed: 31, category: 'forex' },
  CHFJPY: { symbol: "CHFJPY", price: 169.5, base: 169.5, seed: 32, category: 'forex' },

  // 能源
  USOIL: { symbol: "USOIL", price: 85, base: 85, seed: 40, category: 'energy' },
  UKOIL: { symbol: "UKOIL", price: 87.8, base: 87.8, seed: 41, category: 'energy' },
  NGAS: { symbol: "NGAS", price: 2.8, base: 2.8, seed: 42, category: 'energy' },

  // 指数
  US500: { symbol: "US500", price: 5200, base: 5200, seed: 50, category: 'cfd' },
  ND100: { symbol: "ND100", price: 18500, base: 18500, seed: 51, category: 'cfd' },
  AUS200: { symbol: "AUS200", price: 7807, base: 7807, seed: 52, category: 'cfd' },
  UK100: { symbol: "UK100", price: 8098, base: 8098, seed: 53, category: 'cfd' },
  GER40: { symbol: "GER40", price: 17814, base: 17814, seed: 54, category: 'cfd' },
  JPN225: { symbol: "JPN225", price: 40034, base: 40034, seed: 55, category: 'cfd' },
}

/**
 * 计算下一个价格
 * 使用正弦波 + 随机种子，确保每个交易对独立波动
 */
function nextPrice(data: SymbolData): number {
  const t = Date.now() / 1000

  // 使用时间 + 种子产生不同的波动模式
  const wave = Math.sin(t + data.seed)

  // 波动率：基准价格的 0.1%
  const volatility = data.base * 0.001

  // 价格变化
  const change = wave * volatility

  // 新价格
  const newPrice = data.price + change

  // 保留 4 位小数
  return Number(newPrice.toFixed(4))
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
