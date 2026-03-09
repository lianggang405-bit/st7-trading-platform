// 行情数据类型
export interface TickerData {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  high?: number;
  low?: number;
  volume?: number;
  updated_at?: Date;
}

// Binance WebSocket 消息类型
export interface BinanceTradeMessage {
  e: string;      // 事件类型
  E: number;      // 事件时间
  s: string;      // 交易对
  t: number;      // 交易ID
  p: string;      // 价格
  q: string;      // 数量
  b: number;      // 买方订单ID
  a: number;      // 卖方订单ID
  T: number;      // 交易时间
  m: boolean;     // 是否为做市商
  M: boolean;     // 是否忽略
}

// K线数据类型
export interface KlineData {
  symbol: string;
  interval: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  open_time: number;
  close_time: number;
}
