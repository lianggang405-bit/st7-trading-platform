/**
 * 数据展示组件集合
 *
 * 统一管理所有数据格式化组件
 *
 * 使用规范：
 * - 严禁在页面中直接使用 toFixed, toLocaleString
 * - 严禁在页面中硬编码 +/- 颜色
 * - 所有数字展示必须通过这些组件
 */

export { Amount } from './Amount';
export { Price } from './Price';
export { Change } from './Change';
export { AssetPair } from './AssetPair';
