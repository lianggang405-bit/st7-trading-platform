/**
 * Amount - 资产金额组件
 *
 * 用于展示资产金额（USDT/USD 等），统一格式化规则
 *
 * @example
 * <Amount value={1234.567} /> // 1,234.57 USDT
 * <Amount value={1234.567} precision={4} /> // 1,234.5670 USDT
 * <Amount value={1234.567} currency="USD" /> // 1,234.57 USD
 */

export function Amount({
  value,
  precision = 2,
  currency = 'USDT',
  showCurrency = true,
  className = '',
}: {
  value: number | string;
  precision?: number;
  currency?: string;
  showCurrency?: boolean;
  className?: string;
}) {
  // 处理 string 类型
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // 处理无效值
  if (isNaN(numValue)) {
    return <span className={`font-medium text-gray-400 ${className}`}>--</span>;
  }

  // 格式化数字
  const formatted = numValue.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  return (
    <span className={`font-medium tabular-nums ${className}`}>
      {formatted}
      {showCurrency && <span className="ml-1">{currency}</span>}
    </span>
  );
}
