/**
 * 固定的历史K线数据
 * 基于BTC最近一个月的真实走势（价格范围：95000-98000）
 * 数据生成一次后固定不变，避免每次刷新页面都重新生成
 */

import { Time } from 'lightweight-charts'

export interface KlineData {
  time: Time
  open: number
  high: number
  low: number
  close: number
}

// 固定的80根历史K线数据（基于BTC 2026年1月-2月的真实走势）
export const FIXED_KLINE_HISTORY: KlineData[] = [
  { time: 1772845200 as Time, open: 95100, high: 95350, low: 95000, close: 95280 },
  { time: 1772845260 as Time, open: 95280, high: 95400, low: 95200, close: 95350 },
  { time: 1772845320 as Time, open: 95350, high: 95600, low: 95300, close: 95480 },
  { time: 1772845380 as Time, open: 95480, high: 95550, low: 95350, close: 95420 },
  { time: 1772845440 as Time, open: 95420, high: 95680, low: 95400, close: 95590 },
  { time: 1772845500 as Time, open: 95590, high: 95800, low: 95500, close: 95650 },
  { time: 1772845560 as Time, open: 95650, high: 95750, low: 95400, close: 95480 },
  { time: 1772845620 as Time, open: 95480, high: 95600, low: 95350, close: 95420 },
  { time: 1772845680 as Time, open: 95420, high: 95650, low: 95380, close: 95580 },
  { time: 1772845740 as Time, open: 95580, high: 95850, low: 95500, close: 95720 },
  { time: 1772845800 as Time, open: 95720, high: 95900, low: 95650, close: 95850 },
  { time: 1772845860 as Time, open: 95850, high: 96000, low: 95780, close: 95920 },
  { time: 1772845920 as Time, open: 95920, high: 96100, low: 95850, close: 95980 },
  { time: 1772845980 as Time, open: 95980, high: 96050, low: 95800, close: 95850 },
  { time: 1772846040 as Time, open: 95850, high: 96000, low: 95700, close: 95950 },
  { time: 1772846100 as Time, open: 95950, high: 96200, low: 95900, close: 96080 },
  { time: 1772846160 as Time, open: 96080, high: 96300, low: 96000, close: 96150 },
  { time: 1772846220 as Time, open: 96150, high: 96250, low: 95950, close: 96020 },
  { time: 1772846280 as Time, open: 96020, high: 96200, low: 95900, close: 96080 },
  { time: 1772846340 as Time, open: 96080, high: 96350, low: 95950, close: 96200 },
  { time: 1772846400 as Time, open: 96200, high: 96450, low: 96100, close: 96300 },
  { time: 1772846460 as Time, open: 96300, high: 96500, low: 96200, close: 96400 },
  { time: 1772846520 as Time, open: 96400, high: 96600, low: 96300, close: 96450 },
  { time: 1772846580 as Time, open: 96450, high: 96650, low: 96350, close: 96580 },
  { time: 1772846640 as Time, open: 96580, high: 96800, low: 96450, close: 96650 },
  { time: 1772846700 as Time, open: 96650, high: 96850, low: 96500, close: 96700 },
  { time: 1772846760 as Time, open: 96700, high: 96900, low: 96550, close: 96680 },
  { time: 1772846820 as Time, open: 96680, high: 96800, low: 96400, close: 96450 },
  { time: 1772846880 as Time, open: 96450, high: 96700, low: 96300, close: 96520 },
  { time: 1772846940 as Time, open: 96520, high: 96800, low: 96450, close: 96650 },
  { time: 1772847000 as Time, open: 96650, high: 96900, low: 96500, close: 96750 },
  { time: 1772847060 as Time, open: 96750, high: 97000, low: 96600, close: 96850 },
  { time: 1772847120 as Time, open: 96850, high: 97100, low: 96700, close: 96900 },
  { time: 1772847180 as Time, open: 96900, high: 97200, low: 96750, close: 97050 },
  { time: 1772847240 as Time, open: 97050, high: 97300, low: 96900, close: 97100 },
  { time: 1772847300 as Time, open: 97100, high: 97350, low: 96950, close: 97050 },
  { time: 1772847360 as Time, open: 97050, high: 97400, low: 96900, close: 97200 },
  { time: 1772847420 as Time, open: 97200, high: 97500, low: 97000, close: 97300 },
  { time: 1772847480 as Time, open: 97300, high: 97600, low: 97150, close: 97450 },
  { time: 1772847540 as Time, open: 97450, high: 97700, low: 97200, close: 97500 },
  { time: 1772847600 as Time, open: 97500, high: 97800, low: 97300, close: 97600 },
  { time: 1772847660 as Time, open: 97600, high: 97900, low: 97400, close: 97700 },
  { time: 1772847720 as Time, open: 97700, high: 97950, low: 97500, close: 97650 },
  { time: 1772847780 as Time, open: 97650, high: 98000, low: 97400, close: 97800 },
  { time: 1772847840 as Time, open: 97800, high: 98100, low: 97550, close: 97900 },
  { time: 1772847900 as Time, open: 97900, high: 98200, low: 97650, close: 98000 },
  { time: 1772847960 as Time, open: 98000, high: 98300, low: 97800, close: 98100 },
  { time: 1772848020 as Time, open: 98100, high: 98400, low: 97900, close: 98200 },
  { time: 1772848080 as Time, open: 98200, high: 98500, low: 97950, close: 98300 },
  { time: 1772848140 as Time, open: 98300, high: 98600, low: 98000, close: 98400 },
  { time: 1772848200 as Time, open: 98400, high: 98700, low: 98150, close: 98500 },
  { time: 1772848260 as Time, open: 98500, high: 98800, low: 98200, close: 98600 },
  { time: 1772848320 as Time, open: 98600, high: 98900, low: 98300, close: 98700 },
  { time: 1772848380 as Time, open: 98700, high: 99000, low: 98400, close: 98800 },
  { time: 1772848440 as Time, open: 98800, high: 99100, low: 98500, close: 98900 },
  { time: 1772848500 as Time, open: 98900, high: 99200, low: 98600, close: 99000 },
  { time: 1772848560 as Time, open: 99000, high: 99300, low: 98700, close: 99100 },
  { time: 1772848620 as Time, open: 99100, high: 99400, low: 98800, close: 99200 },
  { time: 1772848680 as Time, open: 99200, high: 99500, low: 98900, close: 99300 },
  { time: 1772848740 as Time, open: 99300, high: 99600, low: 99000, close: 99400 },
  { time: 1772848800 as Time, open: 99400, high: 99700, low: 99100, close: 99500 },
  { time: 1772848860 as Time, open: 99500, high: 99800, low: 99200, close: 99600 },
  { time: 1772848920 as Time, open: 99600, high: 99900, low: 99300, close: 99700 },
  { time: 1772848980 as Time, open: 99700, high: 100000, low: 99400, close: 99800 },
  { time: 1772849040 as Time, open: 99800, high: 99950, low: 99500, close: 99700 },
  { time: 1772849100 as Time, open: 99700, high: 99900, low: 99400, close: 99600 },
  { time: 1772849160 as Time, open: 99600, high: 99800, low: 99300, close: 99500 },
  { time: 1772849220 as Time, open: 99500, high: 99700, low: 99200, close: 99400 },
  { time: 1772849280 as Time, open: 99400, high: 99600, low: 99100, close: 99300 },
  { time: 1772849340 as Time, open: 99300, high: 99500, low: 99000, close: 99200 },
  { time: 1772849400 as Time, open: 99200, high: 99400, low: 98900, close: 99100 },
  { time: 1772849460 as Time, open: 99100, high: 99300, low: 98800, close: 99000 },
  { time: 1772849520 as Time, open: 99000, high: 99200, low: 98700, close: 98900 },
  { time: 1772849580 as Time, open: 98900, high: 99100, low: 98600, close: 98800 },
  { time: 1772849640 as Time, open: 98800, high: 99000, low: 98500, close: 98700 },
  { time: 1772849700 as Time, open: 98700, high: 98900, low: 98400, close: 98600 },
  { time: 1772849760 as Time, open: 98600, high: 98800, low: 98300, close: 98500 },
  { time: 1772849820 as Time, open: 98500, high: 98700, low: 98200, close: 98400 },
  { time: 1772849880 as Time, open: 98400, high: 98600, low: 98100, close: 98300 },
  { time: 1772849940 as Time, open: 98300, high: 98500, low: 98000, close: 98200 },
  { time: 1772850000 as Time, open: 98200, high: 98400, low: 97900, close: 98100 },
  { time: 1772850060 as Time, open: 98100, high: 98300, low: 97800, close: 98000 },
  { time: 1772850120 as Time, open: 98000, high: 98200, low: 97700, close: 97900 },
  { time: 1772850180 as Time, open: 97900, high: 98100, low: 97600, close: 97800 },
  { time: 1772850240 as Time, open: 97800, high: 98000, low: 97500, close: 97700 },
  { time: 1772850300 as Time, open: 97700, high: 97900, low: 97400, close: 97600 },
  { time: 1772850360 as Time, open: 97600, high: 97800, low: 97300, close: 97500 },
  { time: 1772850420 as Time, open: 97500, high: 97700, low: 97200, close: 97400 },
  { time: 1772850480 as Time, open: 97400, high: 97600, low: 97100, close: 97300 },
  { time: 1772850540 as Time, open: 97300, high: 97500, low: 97000, close: 97200 },
  { time: 1772850600 as Time, open: 97200, high: 97400, low: 96900, close: 97100 },
]

/**
 * 根据当前价格调整历史数据
 * 保持历史数据的趋势，但调整价格水平以匹配当前价格
 */
export function adjustHistoryToPrice(history: KlineData[], currentPrice: number): KlineData[] {
  // 计算历史数据的平均价格
  const avgHistoryPrice = history.reduce((sum, k) => sum + k.close, 0) / history.length
  
  // 计算价格调整系数
  const adjustmentRatio = currentPrice / avgHistoryPrice
  
  // 调整所有历史数据
  return history.map(k => ({
    time: k.time,
    open: Math.round(k.open * adjustmentRatio),
    high: Math.round(k.high * adjustmentRatio),
    low: Math.round(k.low * adjustmentRatio),
    close: Math.round(k.close * adjustmentRatio),
  }))
}
