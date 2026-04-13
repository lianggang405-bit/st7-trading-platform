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
  pulse = null,
  change = 0,
}: {
  value: number | string;
  precision?: number;
  className?: string;
  pulse?: 'up' | 'down' | null;
  change?: number;
}) {
  // 处理 string 类型
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // 处理无效值
  if (isNaN(numValue)) {
    return <span className={`tabular-nums text-gray-400 ${className}`}>--</span>;
  }

  // 确定颜色（基于涨跌）- 只有非动画状态时才设置颜色
  // 动画状态时让 CSS 动画控制颜色
  const showStaticColor = pulse === null;
  const textColor = showStaticColor
    ? (change > 0 ? '#16a34a' : change < 0 ? '#dc2626' : '#111827')
    : undefined;

  return (
    <span
      className={`font-semibold tabular-nums ${pulse === 'up' ? 'price-up' : ''} ${pulse === 'down' ? 'price-down' : ''}`}
      style={textColor ? { color: textColor } : undefined}
    >
      {numValue.toFixed(precision)}
    </span>
  );
}
