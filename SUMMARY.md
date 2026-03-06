# 压缩摘要

## 用户需求与目标
- 当前目标: 优化 K 线图表显示，修复实时更新错误，大幅增加K线波动幅度
- 倍数和手数输入优化:
  - 倍数支持10倍到500倍，取消下拉菜单，改为手动输入
  - 手数栏支持完全清空重新输入
  - 倍数和手数支持手动清空（可以输入空值）
  - 手动输入更加直观（增大字体、优化样式）
- **最新需求**: 取消掉现在的K线图，恢复到修改之前的简单版本
- **紧急修复**: 修复 `chart.addCandlestickSeries is not a function` 运行时错误
- **紧急修复**: 修复 K 线图不跳动更新且价格有问题，统一 K 线图和交易对的实时数据接入

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
  - lightweight-charts v5.1.0 (专业图表库)

## 核心文件修改
- 文件操作:
  - edit: `src/components/trading/TradingChart.tsx` (统一实时数据接入)
  - edit: `src/app/[locale]/trade/page.tsx`
  - edit: `src/messages/en.json`
  - edit: `src/messages/zh-TW.json`
- 关键修改:
  - **TradingChart.tsx 统一实时数据** (最新):
    - **问题**: K 线图使用独立的模拟数据，与交易对价格数据不统一，导致价格不一致
    - **解决方案**: 
      - 让 K 线图使用 `useMarketStore` 中的实时价格
      - 移除独立的 API 调用
      - 通过 `currentSymbolData.price` 获取与交易对相同的实时价格
      - 添加价格变化检测，避免不必要的更新
      - 确保 K 线图和交易对价格完全同步
  - **TradingChart.tsx 修复 v5 API**:
    - 修复 `chart.addCandlestickSeries is not a function` 错误
    - 更新为 lightweight-charts v5 的正确 API：`chart.addSeries(CandlestickSeries, options)`
  - **交易页面倍数输入优化**:
    - 修改状态类型为 `number | ''`，允许空值
    - 支持手动清空输入框（可以输入空值）
    - 增大字体大小至 18px，加粗显示，更加直观
    - 失去焦点时如果为空，自动设置为 10
    - 在计算时检查 leverage 是否为有效数字
  - **交易页面手数输入优化**:
    - 允许用户完全清空输入框
    - 修改状态类型为 `number | ''`
    - 增大字体大小至 18px，加粗显示，更加直观
    - 失去焦点时如果为空，自动设置为 0.01
    - 在计算时检查 volume 是否为有效数字

## 问题或错误及解决方案
- 问题: K 线图不跳动更新且价格有问题
  - **问题**: 
    - K 线图使用独立的模拟数据，每秒调用 API
    - 交易对价格使用 `marketStore.tick()` 模拟更新
    - 两个数据源不统一，导致价格不一致
  - **解决方案**: 
    - 让 K 线图使用 `useMarketStore` 中的实时价格
    - 通过 `currentSymbolData.price` 获取与交易对相同的实时价格
    - 移除独立的 API 调用
    - 添加价格变化检测，避免不必要的更新
    - 确保 K 线图和交易对价格完全同步
- 问题: `chart.addCandlestickSeries is not a function` 运行时错误
  - **问题**: lightweight-charts v5 的 API 发生了变化，不再支持 `addCandlestickSeries` 方法
  - **解决方案**: 
    - 更新为 v5 的正确 API：`chart.addSeries(CandlestickSeries, options)`
    - 从 `lightweight-charts` 导入 `CandlestickSeries` 类
- 问题: 用户要求恢复 K 线图到修改之前的版本
  - **问题**: 之前的修改增加了太多复杂性，用户希望回到简单版本
  - **解决方案**: 
    - 完全重写 TradingChart.tsx，恢复到最初的简单实现
    - 移除所有错误处理逻辑
    - 移除多道防线检查
    - 移除时间戳对齐逻辑
    - 恢复简单的更新机制
    - 恢复原始的波动幅度（100/50/20）
- 问题: 倍数和手数输入无法清空，手动输入不直观
  - **问题**: 
    - 倍数输入框始终显示数字，无法清空
    - 手数输入框虽然可以清空，但字体较小不够直观
  - **解决方案**: 
    - 倍数和手数的状态类型都改为 `number | ''`
    - onChange 时允许空字符串
    - 增大字体大小至 18px，加粗显示
    - 失去焦点时设置默认值（倍数10，手数0.01）
    - 在计算时检查是否为有效数字

## 数据流统一说明

### 之前的数据流（不统一）
1. **交易对价格**: `marketStore.tick()` → 模拟价格更新（每秒）
2. **K 线图价格**: 独立 API 调用 `/api/market/data` → 真实/模拟价格（每秒）
3. **问题**: 两个数据源不统一，价格不一致

### 现在的数据流（统一）
1. **统一数据源**: `marketStore` → 管理所有交易对的实时价格
2. **交易对价格**: `symbols.find(s => s.symbol === symbol).price`
3. **K 线图价格**: `currentSymbolData.price`（与交易对相同）
4. **实时更新**: TradePage 调用 `tick()` → 更新 marketStore → K 线图自动获取最新价格

## 验证结果
- ✅ 构建检查通过: `npx tsc --noEmit` 无错误
- ✅ 服务状态正常: 5000 端口监听中
- ✅ 前端控制台无错误: 未发现图表相关错误
- ✅ 数据源统一: K 线图和交易对价格使用相同的数据源

## TODO
- 在服务器上拉取最新代码并重新构建部署
- 验证倍数支持手动清空，输入更直观（18px字体）
- 验证手数支持手动清空，输入更直观（18px字体）
- 验证 K 线图正常跳动更新
- 验证 K 线图价格与交易对价格一致
