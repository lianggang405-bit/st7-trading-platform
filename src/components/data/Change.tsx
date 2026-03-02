/**
 * Change - 涨跌幅组件
 *
 * 用于展示涨跌幅，自动添加正负号和颜色
 * - 正值（>= 0）：绿色，带 '+' 号
 * - 负值（< 0）：红色，无 '+' 号
 *
 * @example
 * <Change value={5.67} /> // +5.67% (绿色)
 * <Change value={-3.21} /> // -3.21% (红色)
 * <Change value={0} /> // 0.00% (绿色)
 * <Change value={5.67} showArrow /> // ▲ +5.67% (绿色，带三角形箭头)
 */

export function Change({
  value,
  precision = 2,
  className = '',
  showArrow = false,
}: {
  value: number | string;
  precision?: number;
  className?: string;
  showArrow?: boolean;
}) {
  // 处理 string 类型
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // 处理无效值
  if (isNaN(numValue)) {
    return <span className={`text-gray-400 ${className}`}>--</span>;
  }

  const isUp = numValue >= 0;
  const formatted = Math.abs(numValue).toFixed(precision);

  // 三角形箭头 SVG
  const ArrowIcon = () => (
    <svg
      width="12"
      height="12"
      viewBox="0 0 8 8"
      className={isUp ? 'rotate-0' : 'rotate-180'}
    >
      <path
        d="M4 0.5L7 6H1L4 0.5Z"
        fill="currentColor"
      />
    </svg>
  );

  return (
    <span
      className={`tabular-nums font-medium flex items-center gap-1 ${
        isUp ? 'text-green-500' : 'text-red-500'
      } ${className}`}
    >
      {showArrow && <ArrowIcon />}
      {isUp ? '+' : ''}
      {formatted}%
    </span>
  );
}
