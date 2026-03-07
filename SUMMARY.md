# 压缩摘要

## 用户需求与目标
- 当前目标: 优化 K 线图表显示，修复实时更新错误，大幅增加K线波动幅度
- **最新需求**: 修复手数输入框自动补零问题
  - 用户输入 20 时变成 020，无法正常输入
  - 原因是使用 number 类型的 state，在 onChange 时使用 parseFloat || 0 导致自动补零
  - 解决方案：将 volume 状态改为 string 类型，只在计算时转换为数字
- **之前需求**: 修改倍数和手数输入方式
  - 倍数栏：取消手动输入，改为下拉菜单，支持100-500五档
  - 手数栏：从0.1开始，支持手动输入，可以清零
- **之前需求**: 接入外部实时价格（Binance API），不再使用模拟数据
- **之前需求**: 修复 K 线图不跳动更新且价格有问题，统一 K 线图和交易对的实时数据接入
- **之前需求**: 修复 `chart.addCandlestickSeries is not a function` 运行时错误

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
  - edit: `src/app/[locale]/trade/page.tsx` (倍数改为下拉菜单，手数优化)
  - edit: `src/app/[locale]/trade/page.tsx` (接入外部实时价格)
  - edit: `src/components/trading/TradingChart.tsx` (统一实时数据接入)
  - edit: `src/messages/en.json`
  - edit: `src/messages/zh-TW.json`
- 关键修改:
  - **TradePage.tsx 倍数改为下拉菜单 (最新)**:
    - **需求**: 倍数栏取消手动输入，改为下拉菜单，支持100-500五档
    - **解决方案**: 
      - 使用 shadcn/ui 的 Select 组件替代原来的加减按钮
      - 倍数类型改为 `100 | 200 | 300 | 400 | 500`
      - 默认值改为 100
      - 提供五个选项：100x、200x、300x、400x、500x
  - **TradePage.tsx 手数优化 (最新)**:
    - **需求**: 手数从0.1开始，支持手动输入，可以清零
    - **解决方案**: 
      - 修改步长从 0.01 改为 0.1
      - 修改最小值从 0.01 改为 0（允许清零）
      - 保留手动输入功能
      - 默认值为 0.1
  - **TradePage.tsx 修复手数输入框自动补零问题 (最新)**:
    - **问题**: 用户输入 20 时变成 020，无法正常输入
    - **根因**: 
      - `volume` 状态为 `number` 类型（初始值 `0.1`）
      - `onChange` 使用 `parseFloat(e.target.value) || 0`
      - 当用户删除输入框内容时，`"" → parseFloat("") = NaN → || 0`，自动变为 0
      - React 每次渲染都补一个 0，导致输入 2 变成 02，20 变成 020
    - **解决方案**: 
      - 将 `volume` 状态类型从 `number` 改为 `string`
      - 修改 input 的 `type` 为 `text`，添加 `inputMode="decimal"`
      - 修改 `onChange` 逻辑，使用正则表达式 `/^\d*\.?\d*$/` 验证输入
      - 只允许输入数字和小数点，最多一个小数点
      - 在计算时使用 `parseFloat(volume)` 转换为数字
      - 保留确认对话框中的字符串显示，保持用户输入格式
  - **TradePage.tsx 接入外部实时价格**:
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
  - **TradingChart.tsx 添加最新价格线 (最新)**:
    - **需求**: K线图需要显示跟着价格跳动的虚线（最新价格线）
    - **解决方案**: 
      - 使用 `createPriceLine()` 创建价格线
      - 设置 `lineStyle: 2`（虚线样式）
      - 价格线颜色根据涨跌变化（绿色涨，红色跌）
      - 每次价格更新时更新价格线位置
      - 在组件卸载时移除价格线
  - **TradingChart.tsx 优化K线图实时更新 (最新)**:
    - **问题**: K线图不向右移动，看起来不动
    - **解决方案**: 
      - 添加 `rightBarStaysOnScroll: true` 配置，确保图表贴右边
      - 每次价格更新时调用 `scrollToRealTime()` 强制滚动
      - 使用 ref 存储最新价格，避免闭包问题
      - 确保更新当前K线和新增K线时都会滚动
  - **TradingChart.tsx 修复 v5 API**:
    - 修复 `chart.addCandlestickSeries is not a function` 错误
    - 更新为 lightweight-charts v5 的正确 API
  - **TradingChart.tsx 修复 TypeScript 类型错误 (最新)**:
    - **问题**: 构建时报错 `Type 'number' is not assignable to type 'Time'`
    - **解决方案**: 
      - 在更新 K 线时，将 `time` 字段显式转换为 `Time` 类型
      - 使用 `lastCandle.time as Time` 确保类型兼容

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
- 问题: 倍数栏需要改为下拉菜单，支持100-500五档
  - **问题**: 倍数使用加减按钮，不支持100-500的高倍数范围
  - **解决方案**: 
    - 使用 shadcn/ui 的 Select 组件替代加减按钮
    - 倍数类型改为 `100 | 200 | 300 | 400 | 500`
    - 提供五个固定选项：100x、200x、300x、400x、500x
- 问题: 手数需要从0.1开始，可以清零
  - **问题**: 手数最小值为0.01，步长为0.01，不允许清零
  - **解决方案**: 
    - 修改步长从 0.01 改为 0.1
    - 修改最小值从 0.01 改为 0（允许清零）
    - 默认值保持 0.1
- 问题: 手数输入框自动补零
  - **问题**: 用户输入 20 时变成 020，无法正常输入
  - **根因**: 
    - `volume` 状态为 `number` 类型，`onChange` 使用 `parseFloat(e.target.value) || 0`
    - 当输入为空时，自动变为 0，React 每次渲染都补一个 0
  - **解决方案**: 
    - 将 `volume` 状态类型从 `number` 改为 `string`
    - 修改 input 的 `type` 为 `text`，添加 `inputMode="decimal"`
    - 使用正则表达式 `/^\d*\.?\d*$/` 验证输入
    - 在计算时使用 `parseFloat(volume)` 转换为数字
- 问题: K 线图不跳动更新且价格有问题
  - **问题**: TradePage 使用 `tick()` 模拟价格，没有调用真实 API
  - **解决方案**: 修改为调用 `/api/market/data?useRealData=true` API
- 问题: 没有接入外部实时价格
  - **问题**: 代码中有接入外部价格的逻辑，但 TradePage 没有调用
  - **解决方案**: 让 TradePage 每秒调用 `/api/market/data` 获取真实价格
- 问题: `chart.addCandlestickSeries is not a function` 运行时错误
  - **解决方案**: 更新为 lightweight-charts v5 的正确 API
- 问题: 构建时 TypeScript 类型错误
  - **问题**: `Type 'number' is not assignable to type 'Time'` 在更新 K 线时
  - **解决方案**: 
    - 在更新当前 K 线时，将 `time` 字段显式转换为 `Time` 类型
    - 使用 `lastCandle.time as Time` 确保类型兼容

## 验证结果
- ✅ 构建检查通过: `npx tsc --noEmit` 无错误
- ✅ 服务状态正常: 5000 端口监听中
- ✅ 倍数改为下拉菜单: 使用 Select 组件，支持100-500五档
- ✅ 手数优化: 从0.1开始，步长0.1，最小值0（允许清零）
- ✅ 接入外部实时价格: TradePage 调用 `/api/market/data?useRealData=true`
- ✅ 数据源统一: K 线图和交易对价格使用相同的真实数据源

## TODO
- 在服务器上拉取最新代码并重新构建部署
- 验证倍数栏为下拉菜单，支持100x、200x、300x、400x、500x五个选项
- 验证手数栏从0.1开始，步长0.1，可以手动清零
- 验证 K 线图正常跳动更新
- 验证 K 线图价格与交易对价格一致
- 验证使用的是外部真实价格（Binance API）
