/**
 * AssetPair - 交易对组件
 *
 * 用于展示交易对名称，格式为 BASE/QUOTE
 * 如：BTC/USDT, ETH/USDT
 *
 * @example
 * <AssetPair base="BTC" quote="USDT" /> // BTC/USDT
 * <AssetPair base="ETH" quote="USD" /> // ETH/USD
 */

export function AssetPair({
  base,
  quote,
  className = '',
}: {
  base: string;
  quote: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 font-semibold ${className}`}>
      <span>{base}</span>
      <span className="text-gray-400">/</span>
      <span className="text-gray-400">{quote}</span>
    </div>
  );
}
