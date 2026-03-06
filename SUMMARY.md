# 压缩摘要

## 用户需求与目标
- 当前目标: 优化 K 线图表显示，修复实时更新错误，大幅增加K线波动幅度

## 项目概览
- 概述: ST7全球交易平台，包含用户端（交易、钱包、入金、出金、公告）和管理端（用户管理、订单管理、充提管理、信息管理、系统设置）
- 技术栈:
  - Next.js 16 (App Router)
  - React 19
  - TypeScript 5
  - Supabase (数据库)
  - Zustand (状态管理)
  - shadcn/ui (UI组件)
  - Tailwind CSS 4
  - next-intl (国际化)
  - coze-coding-dev-sdk (对象存储)
  - PM2 (进程管理)
  - lightweight-charts (专业图表库)

## 核心文件修改
- 文件操作:
  - edit: `src/components/trading/TradingChart.tsx`
- 关键修改:
  - **大幅增加K线波动幅度**（核心优化）:
    - 历史K线生成: 从 100/50/20 提升到 **400/200/100**
    - 实时更新波动: 从 50 提升到 **100**
    - 适配 98000 价格级别的交易对，使K线明显可见
  - **修复 "Object is disposed" 错误**:
    - 在 `useEffect` 开始时立即清理旧资源并设置 `isDisposedRef`
    - 在所有图表操作前检查 `isDisposedRef`
    - 对滚动操作进行 try-catch 保护
    - 添加多道防线（定时器回调开始、获取价格后、更新前）
  - **修复 "Cannot update oldest data" 错误**:
    - 确保 `lastCandle.time` 时间戳类型一致性，统一使用数字类型
    - 在更新操作前增加额外的有效性检查
    - 捕获特定错误并记录详细信息，优雅地跳过过期数据更新
  - **优化 K 线显示**: 调整 `timeScale` 配置，增加 `barSpacing: 8`、`rightOffset: 12` 等
  - **实现平滑滚动**: 使用 `chart.timeScale().scrollToPosition(0, true)` 替代 `scrollToRealTime()`
  - **应用 Binance 标准配色**: 更新 K 线颜色为 `#0ECB81` (涨) 和 `#F6465D` (跌)
  - **提升更新频率**: 将实时更新间隔从 3000ms 降低至 800ms
  - **增强交互性**: 添加 `handleScroll` 和 `handleScale` 配置，支持鼠标滚轮缩放和拖动

## 问题或错误及解决方案
- 问题: K线数据波动太小，看起来像一条直线
  - **问题**: 对于 98000 的价格，100/50/20 的波动几乎看不见
  - **解决方案**: 
    - 历史K线生成波动提升至 400/200/100
    - 实时更新波动提升至 100
    - 使K线高度明显可见，符合真实交易所效果
- 问题: "Object is disposed" 运行时错误
  - **问题**: 图表对象销毁后，定时器或事件监听器仍在尝试调用图表方法。
  - **解决方案**: 
    - 在 `useEffect` 入口处立即清理旧资源并设置 `isDisposedRef`
    - 在所有图表操作前检查销毁状态
    - 对滚动操作进行 try-catch 保护
    - 添加三道防线确保资源有效性
- 问题: "Cannot update oldest data" 运行时错误
  - **问题**: `lightweight-charts` 在更新 K 线时检测到时间戳类型不一致或比较失败。
  - **解决方案**: 
    - 读取 `lastCandle.time` 时进行类型检查并转换为数字
    - 确保比较和更新时使用统一的时间戳类型
    - 在更新前增加额外的有效性检查
    - 捕获特定错误并记录详细信息，优雅地跳过过期数据更新
- 问题: K 线显示过密，像一条线
  - **问题**: 缺少 `barSpacing` 和 `rightOffset` 配置。
  - **解决方案**: 增加 `barSpacing: 8`、`rightOffset: 12`、`minBarSpacing: 6` 等配置。
- 问题: 价格波动过大，K 线乱跳（已解决）
  - **问题**: 模拟价格波动幅度设置为 1000/500。
  - **解决方案**: 降低波动幅度至 100/50（现已优化为 400/200/100）。

## 可选优化建议（待实施）
- 接入真实行情数据:
  - Binance API 获取价格: `https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT`
  - Binance API 获取K线: `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1m&limit=200`
  - 实现 WebSocket 实时更新，类似 Binance/TradingView
- 确保交易对符号映射: BTCUSD → BTCUSDT（适配Binance接口）

## 验证结果
- ✅ 构建检查通过: `npx tsc --noEmit` 无错误
- ✅ 服务状态正常: 5000 端口监听中
- ✅ 前端控制台无错误: 未发现图表相关错误
- ⚠️ 后端日志显示网络错误: ECONNRESET (Binance API 连接问题，不影响图表组件)

## TODO
- 在服务器上拉取最新代码并重新构建部署
- 验证图表组件K线是否明显可见（不再是直线）
- 测试实时更新功能是否平滑
- 验证多语言支持
- （可选）接入真实Binance行情数据
