/**
 * Market Engine - 统一行情引擎（简化版）
 *
 * 核心原则：
 * - 只有一个价格生成器
 * - 每个交易对有自己的波动（独立随机种子）
 * - 所有页面只读 marketStore
 * - 1秒统一刷新
 */

// 交易对配置（统一价格源）
const symbolConfigs = new Map<string, {
  symbol: string
  basePrice: number
  category: "crypto" | "metal" | "forex" | "energy" | "cfd"
  seed: number  // 每个交易对独立的随机种子
}>()

// 初始化交易对配置
function initSymbols() {
  const configs = [
    // Crypto
    { symbol: "BTCUSDT", basePrice: 100000, category: "crypto" as const },
    { symbol: "ETHUSDT", basePrice: 4000, category: "crypto" as const },
    { symbol: "LTCUSDT", basePrice: 150, category: "crypto" as const },
    { symbol: "SOLUSDT", basePrice: 200, category: "crypto" as const },
    { symbol: "XRPUSDT", basePrice: 0.6, category: "crypto" as const },
    { symbol: "DOGEUSDT", basePrice: 0.2, category: "crypto" as const },
    { symbol: "ADAUSDT", basePrice: 1.2, category: "crypto" as const },
    { symbol: "DOTUSDT", basePrice: 8, category: "crypto" as const },

    // Metal
    { symbol: "XAUUSD", basePrice: 5200, category: "metal" as const },
    { symbol: "XAGUSD", basePrice: 29.5, category: "metal" as const },

    // Forex
    { symbol: "EURUSD", basePrice: 1.085, category: "forex" as const },
    { symbol: "GBPUSD", basePrice: 1.265, category: "forex" as const },
    { symbol: "USDJPY", basePrice: 149.8, category: "forex" as const },
    { symbol: "USDCHF", basePrice: 0.884, category: "forex" as const },
    { symbol: "AUDUSD", basePrice: 0.654, category: "forex" as const },
    { symbol: "NZDUSD", basePrice: 0.608, category: "forex" as const },
    { symbol: "USDCAD", basePrice: 1.365, category: "forex" as const },
    { symbol: "EURGBP", basePrice: 0.858, category: "forex" as const },
    { symbol: "EURJPY", basePrice: 162.5, category: "forex" as const },
    { symbol: "GBPJPY", basePrice: 189.5, category: "forex" as const },
    { symbol: "AUDJPY", basePrice: 98.12, category: "forex" as const },
    { symbol: "CADJPY", basePrice: 110.45, category: "forex" as const },
    { symbol: "CHFJPY", basePrice: 169.54, category: "forex" as const },

    // Energy
    { symbol: "USOIL", basePrice: 85.0, category: "energy" as const },
    { symbol: "UKOIL", basePrice: 88.0, category: "energy" as const },
    { symbol: "NGAS", basePrice: 2.8, category: "energy" as const },

    // CFD
    { symbol: "US500", basePrice: 5200, category: "cfd" as const },
    { symbol: "ND100", basePrice: 18500, category: "cfd" as const },
    { symbol: "AUS200", basePrice: 7800, category: "cfd" as const },
    { symbol: "UK100", basePrice: 8100, category: "cfd" as const },
    { symbol: "GER40", basePrice: 17800, category: "cfd" as const },
    { symbol: "JPN225", basePrice: 40000, category: "cfd" as const },
  ]

  for (const config of configs) {
    // 生成独立随机种子
    const seed = config.symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

    symbolConfigs.set(config.symbol, {
      ...config,
      seed,
    })
  }

  console.log(`[MarketEngine] 初始化了 ${configs.length} 个交易对`)
}

// 当前价格缓存（单一数据源）
const currentPrices = new Map<string, {
  price: number
  basePrice: number
  change: number
}>()

// 基准价格缓存（用于计算涨跌幅）
const basePrices = new Map<string, number>()

/**
 * 生成价格（每个交易对独立波动）
 */
function generatePrice(symbol: string, basePrice: number, seed: number): number {
  const config = symbolConfigs.get(symbol)
  if (!config) return basePrice

  // 根据价格范围自动调整波动性
  const autoVolatility = basePrice > 100 ? 0.001 : 0.002

  // 使用独立随机种子（每个交易对不一样）
  const t = Date.now() / 1000
  const wave = Math.sin(t + seed)  // 关键：每个交易对有自己的 seed

  // 添加随机噪声
  const noise = (Math.random() - 0.5) * autoVolatility * 0.5

  return basePrice * (1 + autoVolatility * wave + noise)
}

/**
 * 更新所有交易对价格（统一刷新）
 */
function updateAllPrices() {
  for (const [symbol, config] of symbolConfigs) {
    const price = generatePrice(symbol, config.basePrice, config.seed)

    // 第一次获取价格时，保存为基准价格
    if (!basePrices.has(symbol)) {
      basePrices.set(symbol, price)
    }

    const basePrice = basePrices.get(symbol)!
    const change = ((price - basePrice) / basePrice) * 100

    currentPrices.set(symbol, {
      price,
      basePrice,
      change,
    })
  }
}

/**
 * 获取所有交易对数据（每次调用都会更新价格）
 */
export function getAllSymbols() {
  // 每次调用都更新价格
  updateAllPrices()

  return Array.from(symbolConfigs.values()).map(config => {
    const data = currentPrices.get(config.symbol) || {
      price: config.basePrice,
      basePrice: config.basePrice,
      change: 0,
    }

    return {
      symbol: config.symbol,
      price: data.price,
      change: data.change,
      basePrice: data.basePrice,
      category: config.category,
    }
  })
}

/**
 * 获取单个交易对价格
 */
export function getSymbolPrice(symbol: string): { price: number; change: number } | null {
  const data = currentPrices.get(symbol)
  if (!data) return null

  return {
    price: data.price,
    change: data.change,
  }
}

/**
 * 启动行情系统
 */
let updateInterval: NodeJS.Timeout | null = null

export function startMarketEngine() {
  if (updateInterval) {
    console.log('[MarketEngine] 行情系统已在运行')
    return
  }

  console.log('[MarketEngine] 启动行情系统')

  initSymbols()
  updateAllPrices()

  // 每秒刷新一次
  updateInterval = setInterval(() => {
    updateAllPrices()
  }, 1000)

  console.log('[MarketEngine] 行情系统已启动，每秒刷新一次')
}

/**
 * 停止行情系统
 */
export function stopMarketEngine() {
  if (updateInterval) {
    clearInterval(updateInterval)
    updateInterval = null
    console.log('[MarketEngine] 行情系统已停止')
  }
}

// 自动启动（服务端）
if (typeof process !== 'undefined' && process.versions?.node) {
  startMarketEngine()
}
