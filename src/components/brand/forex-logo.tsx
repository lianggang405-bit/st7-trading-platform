import { LOGO_PATH } from '../../constants/paths';

/**
 * FOREX Logo 组件
 * 使用新的品牌标识图片
 */
export function ForexLogo() {
  return (
    <img
      src={LOGO_PATH}
      alt="FOREX Logo"
      className="h-28 w-auto"
    />
  );
}
