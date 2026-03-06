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
- **核心修复**: 接入外部实时价格（Binance API），不再使用模拟数据

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
  - edit: `src/app/[locale]/trade/page.tsx` (接入外部实时价格)
  - edit: `src/components/trading/TradingChart.tsx` (统一实时数据接入)
  - edit: `src/messages/en.json`
  - edit: `src/messages/zh-TW.json`
- 关键修改:
  - **TradePage.tsx 接入外部实时价格** (最新):
    - **问题**: TradePage 使用 `tick()` 方法模拟价格变化，没有调用真实 API
    - **解决方案**: 
      - 修改为调用 `/api/market/data?useRealData=true` API
      - 该 API 从 Binance 获取真实价格（带重试和降级机制）
      - 每秒更新一次市场数据
      - 更新 marketStore 中的 symbols
      - 如果 API 失败，降级到 `tick()` 模拟
  - **TradingChart.tsx 统一实时数据**:
    - 让 K 线图使用 `useMarketStore` 中的实时价格
    - 移除独立的 API 调用
    - 通过 `currentSymbolData.price` 获取与交易对相同的实时价格
    - 添加价格变化检测，避免不必要的更新
    - 确保 K 线图和交易对价格完全同步
  - **TradingChart.tsx 修复 v5 API**:
    - 修复 `chart.addCandlestickSeries is not a function` 错误
    - 更新为 lightweight-charts v5 的正确 API
  - **交易页面倍数输入优化**:
    - 修改状态类型为 `number | ''`，允许空值
    - 支持手动清空输入框
    - 增大字体大小至 18px，加粗显示
  - **交易页面手数输入优化**:
    - 允许用户完全清空输入框
    - 修改状态类型为 `number | ''`
    - 增大字体大小至 18px，加粗显示

## 数据流统一说明

### 之前的数据流（使用模拟数据）
```
┌─────────────┐
│ TradePage   │
│ tick()      │ ← 模拟价格变化
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ marketStore │ ← 包含模拟价格
└──────┬──────┘
       │
       ├─────→ 交易对价格（模拟）
       │
       └─────→ K线图价格（模拟）
```

### 现在的数据流（使用外部实时价格）
```
┌─────────────┐
│ TradePage   │
└──────┬──────┘
       │
       ↓ 每秒调用
┌─────────────────────────┐
│ /api/market/data        │
│ ?useRealData=true       │ → Binance API（真实价格）
│                         │ → 降级到模拟（API失败）
└──────────┬──────────────┘
           │
           ↓
┌─────────────┐
│ marketStore │ ← 包含真实价格
└──────┬──────┘
       │
       ├─────→ 交易对价格（真实）
       │
       └─────→ K线图价格（真实）
```

## 外部数据源说明

### Binance API
- **价格接口**: `https://api.binance.com/api/v3/ticker/price`
- **24小时涨跌接口**: `https://api.binance.com/api/v3/ticker/24hr`
- **缓存机制**: 30秒价格缓存，避免频繁调用
- **重试机制**: 最多重试3次，每次间隔1秒
- **降级机制**: API失败时使用模拟数据

### 调控机器人浮点值
- 从数据库 `trading_bots` 表获取 `float_value`
- 调控后价格 = 真实价格 + 浮点值
- 1分钟缓存，避免频繁查询数据库

## 问题或错误及解决方案
- 问题: K 线图不跳动更新且价格有问题
  - **问题**: TradePage 使用 `tick()` 模拟价格，没有调用真实 API
  - **解决方案**: 修改为调用 `/api/market/data?useRealData=true` API
- 问题: 没有接入外部实时价格
  - **问题**: 代码中有接入外部价格的逻辑，但 TradePage 没有调用
  - **解决方案**: 让 TradePage 每秒调用 `/api/market/data` 获取真实价格
- 问题: `chart.addCandlestickSeries is not a function` 运行时错误
  - **解决方案**: 更新为 lightweight-charts v5 的正确 API
- 问题: 倍数和手数输入无法清空
  - **解决方案**: 修改状态类型为 `number | ''`，允许空值

## 验证结果
- ✅ 构建检查通过: `npx tsc --noEmit` 无错误
- ✅ 服务状态正常: 5000 端口监听中
- ✅ 接入外部实时价格: TradePage 调用 `/api/market/data?useRealData=true`
- ✅ 数据源统一: K 线图和交易对价格使用相同的真实数据源

## TODO
- 在服务器上拉取最新代码并重新构建部署
- 验证倍数支持手动清空，输入更直观（18px字体）
- 验证手数支持手动清空，输入更直观（18px字体）
- 验证 K 线图正常跳动更新
- 验证 K 线图价格与交易对价格一致
- 验证使用的是外部真实价格（Binance API）
