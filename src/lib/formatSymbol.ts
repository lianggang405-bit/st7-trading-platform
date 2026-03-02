/**
 * 格式化交易对名称，在中间添加斜杠
 * @param symbol - 交易对名称，如 "BTCUSD"
 * @returns 格式化后的交易对，如 "BTC/USD"
 * @example
 * formatSymbol('BTCUSD') // 'BTC/USD'
 * formatSymbol('EURUSD') // 'EUR/USD'
 */
export function formatSymbol(symbol: string): string {
  if (!symbol) return '--';
  if (symbol.length < 6) return symbol;
  return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
}
