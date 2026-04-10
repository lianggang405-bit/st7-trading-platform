/**
 * 🎯 K线聚合器（交易所级实现）
 *
 * 功能：
 * 1. 基于tick流实时生成OHLC数据
 * 2. 支持多个时间周期（1m, 5m, 15m, 1h, 4h, 1d）
 * 3. 自动处理K线切换（non-repainting）
 * 4. 缓存历史K线数据
 *
 * 核心逻辑：
 * - 每个tick更新当前K线的 close、high、low
 * - 当时间 >= 当前K线开始时间 + 周期时，生成新K线
 * - 历史K线永远固定（不会重新绘制）
 */

// 🎯 时间周期映射（毫秒）
export const INTERVAL_MAP: Record<string, number> = {
  "1m": 60000,
  "5m": 300000,
  "15m": 900000,
  "1h": 3600000,
  "4h": 14400000,
  "1d": 86400000,
}

// 🎯 K线数据结构（交易所标准）
export interface KlineCandle {
  time: number  // K线开始时间戳
  open: number  // 开盘价
  high: number  // 最高价（>= open, close）
  low: number   // 最低价（<= open, close）
  close: number // 收盘价
}

// 🎯 Tick数据结构
export interface Tick {
  symbol: string
  price: number
  timestamp: number
}

// 🎯 K线聚合器类
export class KlineAggregator {
  private candles: Map<string, KlineCandle[]> = new Map()  // 存储各周期的K线数据
  private currentCandles: Map<string, KlineCandle> = new Map()  // 存储当前正在形成的K线
  private readonly maxCandles: number = 200  // 最多保留多少根K线

  constructor() {}

  /**
   * 🎯 处理tick更新（核心方法）
   * @param symbol 交易对
   * @param price 价格
   * @param timestamp 时间戳
   */
  processTick(symbol: string, price: number, timestamp: number): void {
    // 更新所有周期的K线
    for (const interval of Object.keys(INTERVAL_MAP)) {
      this.updateCandle(symbol, interval, price, timestamp)
    }
  }

  /**
   * 🎯 更新指定周期的K线
   * @param symbol 交易对
   * @param interval 时间周期
   * @param price 价格
   * @param timestamp 时间戳
   */
  private updateCandle(symbol: string, interval: string, price: number, timestamp: number): void {
    const key = `${symbol}_${interval}`
    const intervalMs = INTERVAL_MAP[interval]
    const candleTime = this.getCandleTime(timestamp, intervalMs)

    // 获取或创建当前K线
    let currentCandle = this.currentCandles.get(key)

    // 如果当前K线不存在或时间戳不同，创建新K线
    if (!currentCandle || currentCandle.time !== candleTime) {
      // 如果有旧K线，先保存到历史
      if (currentCandle) {
        this.saveCandle(symbol, interval, currentCandle)
      }

      // 创建新K线（确保time是number类型）
      currentCandle = {
        time: typeof candleTime === 'number' ? candleTime : Number(candleTime),
        open: price,
        high: price,
        low: price,
        close: price,
      }
      this.currentCandles.set(key, currentCandle)
    } else {
      // 更新当前K线（核心逻辑）
      currentCandle.close = price
      currentCandle.high = Math.max(currentCandle.high, price)
      currentCandle.low = Math.min(currentCandle.low, price)
    }
  }

  /**
   * 🎯 保存K线到历史记录
   */
  private saveCandle(symbol: string, interval: string, candle: KlineCandle): void {
    const key = `${symbol}_${interval}`
    const candles = this.candles.get(key) || []

    // 确保time字段是number类型
    const normalizedCandle = {
      ...candle,
      time: typeof candle.time === 'number' ? candle.time : Number(candle.time)
    }

    // 🎯 去重检查：防止重复添加相同时间戳的K线
    const existingIndex = candles.findIndex(c => c.time === normalizedCandle.time)
    if (existingIndex >= 0) {
      console.warn(`[KlineAggregator] saveCandle: 重复K线时间戳 ${normalizedCandle.time}，跳过保存`)
      return
    }

    candles.push(normalizedCandle)

    // 限制K线数量
    if (candles.length > this.maxCandles) {
      candles.shift()
    }

    this.candles.set(key, candles)
  }

  /**
   * 🎯 计算K线开始时间（秒级，Lightweight Charts标准）
   * @param timestamp 时间戳（毫秒级）
   * @param intervalMs 周期（毫秒）
   * @returns K线开始时间戳（秒级）
   */
  private getCandleTime(timestamp: number, intervalMs: number): number {
    // 将毫秒级时间戳转换为秒级（Lightweight Charts标准）
    const timestampSec = Math.floor(timestamp / 1000)
    const intervalSec = Math.floor(intervalMs / 1000)
    return Math.floor(timestampSec / intervalSec) * intervalSec
  }

  /**
   * 🎯 获取指定周期的K线数据（包含当前正在形成的K线）
   * @param symbol 交易对
   * @param interval 时间周期
   * @returns K线数据数组
   */
  getCandles(symbol: string, interval: string): KlineCandle[] {
    const key = `${symbol}_${interval}`
    const historicalCandles = this.candles.get(key) || []
    const currentCandle = this.currentCandles.get(key)

    // 🎯 确保所有K线的time字段是纯数字类型
    const normalizeTime = (rawTime: number | any): number => {
      if (typeof rawTime === 'number' && !isNaN(rawTime)) {
        // 毫秒转秒
        if (rawTime > 1000000000000) {
          return Math.floor(rawTime / 1000)
        }
        return rawTime
      }
      const converted = Number(rawTime)
      if (!isNaN(converted)) {
        return converted > 1000000000000 ? Math.floor(converted / 1000) : converted
      }
      return Math.floor(Date.now() / 1000)
    }

    // 🎯 去重：确保返回的数据中没有重复时间戳
    const uniqueCandleMap = new Map<number, KlineCandle>()

    const normalizedHistorical = historicalCandles.map(candle => ({
      ...candle,
      time: normalizeTime(candle.time)
    }))

    for (const candle of normalizedHistorical) {
      if (!uniqueCandleMap.has(candle.time)) {
        uniqueCandleMap.set(candle.time, candle)
      }
    }

    if (currentCandle) {
      const normalizedCurrent = {
        ...currentCandle,
        time: normalizeTime(currentCandle.time)
      }
      // 当前K线不会被历史数据覆盖
      if (!uniqueCandleMap.has(normalizedCurrent.time)) {
        uniqueCandleMap.set(normalizedCurrent.time, normalizedCurrent)
      }
    }

    return Array.from(uniqueCandleMap.values()).sort((a, b) => a.time - b.time)
  }

  /**
   * 🎯 获取当前正在形成的K线
   * @param symbol 交易对
   * @param interval 时间周期
   * @returns 当前K线（如果存在）
   */
  getCurrentCandle(symbol: string, interval: string): KlineCandle | null {
    const key = `${symbol}_${interval}`
    const candle = this.currentCandles.get(key)

    if (!candle) return null

    // 🎯 确保time字段是纯数字类型（防止Lightweight Charts报错）
    let timeValue: number
    const rawTime = candle.time

    if (typeof rawTime === 'number' && !isNaN(rawTime)) {
      timeValue = rawTime
    } else {
      // 尝试转换其他格式
      const converted = Number(rawTime)
      if (!isNaN(converted)) {
        timeValue = converted
      } else {
        console.error('[KlineAggregator] getCurrentCandle: 无效的time值:', rawTime)
        return null
      }
    }

    // 确保是秒级时间戳
    if (timeValue > 1000000000000) {
      timeValue = Math.floor(timeValue / 1000)
    }

    return {
      ...candle,
      time: timeValue
    }
  }

  /**
   * 🎯 清空指定交易对的所有K线数据
   */
  clearSymbol(symbol: string): void {
    for (const interval of Object.keys(INTERVAL_MAP)) {
      const key = `${symbol}_${interval}`
      this.candles.delete(key)
      this.currentCandles.delete(key)
    }
  }

  /**
   * 🎯 批量初始化历史K线数据
   * 用于从API加载历史数据后初始化聚合器
   */
  initHistoricalCandles(symbol: string, interval: string, candles: KlineCandle[]): void {
    const key = `${symbol}_${interval}`

    // 清空现有数据
    this.candles.delete(key)
    this.currentCandles.delete(key)

    // 🎯 确保所有历史K线的time字段都是秒级（Lightweight Charts标准）
    const normalizedCandles = candles.map(candle => {
      let timeValue: number
      const rawTime = candle.time

      if (typeof rawTime === 'number' && !isNaN(rawTime)) {
        timeValue = rawTime
      } else {
        const converted = Number(rawTime)
        if (!isNaN(converted)) {
          timeValue = converted
        } else {
          console.error('[KlineAggregator] initHistoricalCandles: 无效的time值:', rawTime)
          return null
        }
      }

      // 检测并转换毫秒级时间戳为秒级
      if (timeValue > 1000000000000) {
        timeValue = Math.floor(timeValue / 1000)
      }

      return {
        ...candle,
        time: timeValue
      }
    }).filter(c => c !== null) as KlineCandle[]

    // 🎯 去重：确保没有重复的时间戳
    const uniqueCandleMap = new Map<number, KlineCandle>()
    for (const candle of normalizedCandles) {
      if (uniqueCandleMap.has(candle.time)) {
        console.warn(`[KlineAggregator] initHistoricalCandles: 发现重复时间戳 ${candle.time}，跳过`)
        continue
      }
      uniqueCandleMap.set(candle.time, candle)
    }
    const uniqueCandles = Array.from(uniqueCandleMap.values()).sort((a, b) => a.time - b.time)

    console.log(`[KlineAggregator] initHistoricalCandles: 去重 ${normalizedCandles.length} -> ${uniqueCandles.length} 根K线`)

    // 保存历史K线
    this.candles.set(key, uniqueCandles)

    // 如果有历史K线，将最后一根作为当前K线的基准
    if (normalizedCandles.length > 0) {
      const lastCandle = normalizedCandles[normalizedCandles.length - 1]
      this.currentCandles.set(key, {
        time: lastCandle.time,  // 确保time是纯数字
        open: lastCandle.open,
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close
      })
    }
  }
}

// 🎯 全局单例（交易所级架构）
export const klineAggregator = new KlineAggregator()
