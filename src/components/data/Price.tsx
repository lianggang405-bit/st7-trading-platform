/**
 * Price - 行情价格组件
 *
 * 用于展示行情价格，使用 tabular-nums 避免数字跳位
 *
 * @example
 * <Price value={1234.5678} /> // 1234.5678
 * <Price value={1234.5678} precision={2} /> // 1234.57
 * <Price value={1234.5678} precision={8} /> // 1234.56780000
 */

export function Price({
  value,
  precision = 4,
  className = '',
}: {
  value: number | string;
  precision?: number;
  className?: string;
}) {
  // 处理 string 类型
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // 处理无效值
  if (isNaN(numValue)) {
    return <span className={`tabular-nums text-gray-400 ${className}`}>--</span>;
  }

  return (
    <span className={`tabular-nums ${className}`}>
      {numValue.toFixed(precision)}
    </span>
  );
}
