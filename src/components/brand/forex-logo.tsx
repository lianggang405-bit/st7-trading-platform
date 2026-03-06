import Image from 'next/image';
import { LOGO_PATH, LOGO_WIDTH, LOGO_HEIGHT } from '../../constants/paths';

/**
 * FOREX Logo 组件
 * 使用 Next.js Image 组件，unoptimized 模式适配生产环境
 * 
 * 说明：
 * - 添加 unoptimized 属性，禁用 Next.js 图片优化服务
 * - 适配静态部署、CDN 托管、Nginx 静态站等生产环境
 * - 避免 /_next/image 400 错误
 * 
 * 优势（保留 Image 组件的好处）：
 * - 统一的图片组件 API
 * - 自动 alt 和 aria 属性
 * - 类型安全
 * - 便于未来切换回优化模式
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
      unoptimized
    />
  );
}

