import Image from 'next/image';
import { LOGO_PATH, LOGO_WIDTH, LOGO_HEIGHT } from '../../constants/paths';

/**
 * FOREX Logo 组件
 * 使用 Next.js Image 组件，自动优化图片加载
 * 
 * 优势：
 * - 自动 WebP 转换
 * - 自动 CDN 优化
 * - 自动懒加载
 * - 自动尺寸优化
 * - 更好的性能
 */
export function ForexLogo() {
  return (
    <Image
      src={LOGO_PATH}
      alt="FOREX Logo"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      className="h-28 w-auto"
      priority
    />
  );
}

