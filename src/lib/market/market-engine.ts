/**
 * Market Engine - 统一行情引擎
 *
 * 数据源策略：
 * - Crypto → Binance API (真实数据)
 * - Metal → Gold API (真实数据)
 * - 其他 → 模拟数据
 *
 * 设计原则：
 * - 简单：代码量少，逻辑清晰
 * - 稳定：自动降级，失败不影响
 * - 统一：全站只有一个价格源
 */

type SymbolInfo = {
  symbol: string
  type: "crypto" | "metal" | "forex"
  basePrice?: number
}

const symbols: SymbolInfo[] = [
  // Crypto - Binance API
  { symbol: "BTCUSDT", type: "crypto" },
  { symbol: "ETHUSDT", type: "crypto" },

  // Metal - Gold API
  { symbol: "XAUUSD", type: "metal" },
  { symbol: "XAGUSD", type: "metal" },

  // Forex - 模拟数据
  { symbol: "EURUSD", type: "forex", basePrice: 1.08 },
  { symbol: "GBPUSD", type: "forex", basePrice: 1.26 }
]

async function fetchCrypto(symbol: string) {
  const res = await fetch(
    `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`
  )

  const data = await res.json()

  return Number(data.price)
}

async function fetchMetal(symbol: string) {
  const metal = symbol.startsWith("XAU") ? "XAU" : "XAG"

  const res = await fetch(
    `https://api.gold-api.com/price/${metal}`
  )

  const data = await res.json()

  return data.price
}

function mockPrice(base: number) {
  const volatility = base > 100 ? 0.001 : 0.002

  const wave = Math.sin(Date.now() / 1000)

  return base + base * volatility * wave
}

export async function getMarketData() {
  const result = []

  for (const s of symbols) {
    try {
      if (s.type === "crypto") {
        const price = await fetchCrypto(s.symbol)

        result.push({
          symbol: s.symbol,
          price,
          source: "binance"
        })

      } else if (s.type === "metal") {
        const price = await fetchMetal(s.symbol)

        result.push({
          symbol: s.symbol,
          price,
          source: "gold-api"
        })

      } else {
        const price = mockPrice(s.basePrice!)

        result.push({
          symbol: s.symbol,
          price,
          source: "mock"
        })

      }

    } catch {
      const price = mockPrice(s.basePrice || 100)

      result.push({
        symbol: s.symbol,
        price,
        source: "fallback"
      })

    }

  }

  return result
}
