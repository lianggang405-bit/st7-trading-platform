# 监控日志系统

## 概述

这是一个完整的客户端监控日志系统，用于收集项目在用户使用过程中遇到的问题、性能数据和用户行为信息，为后续优化提供依据。

## 功能特性

### 1. 错误监控
- ✅ JavaScript 运行时错误捕获
- ✅ 未处理的 Promise 拒绝捕获
- ✅ console.error 捕获（可选）
- ✅ API 错误记录
- ✅ 网络错误记录

### 2. 性能监控
- ✅ 页面加载性能（加载时间、DOM 内容加载时间、首次绘制时间）
- ✅ API 请求性能（响应时间）
- ✅ Web Vitals 指标（LCP、FID、CLS）
- ✅ 渲染性能

### 3. 用户行为监控
- ✅ 页面访问记录
- ✅ 点击事件跟踪（限流）
- ✅ 路由变化跟踪
- ✅ 用户会话管理

### 4. 安全特性
- ✅ 敏感信息过滤（密码、token 等）
- ✅ 堆栈信息长度限制
- ✅ 采样率控制
- ✅ 批量上报减少请求

## 文件结构

```
src/
├── config/
│   └── monitoring.ts          # 监控配置文件
├── lib/
│   └── monitoring.ts          # 监控核心类
├── components/
│   └── providers/
│       └── monitoring-provider.tsx  # 监控 Provider 组件
├── app/
│   └── api/
│       └── monitoring/
│           ├── log/
│           │   └── route.ts   # 日志上报 API
│           └── logs/
│               └── route.ts   # 日志查看 API（仅开发环境）
logs/
└── monitoring/                # 日志存储目录（不提交到 git）
    └── monitoring-2024-03-06.log
```

## 配置说明

### 环境变量

在 `.env.local` 中添加以下配置：

```bash
# 是否启用监控（开发环境默认关闭，生产环境默认开启）
NEXT_PUBLIC_ENABLE_MONITORING=true

# 日志采样率（0-1），生产环境建议 0.1（10%）
NEXT_PUBLIC_MONITORING_SAMPLE_RATE=0.1
```

### 配置项

在 `src/config/monitoring.ts` 中可以调整以下配置：

```typescript
export const monitoringConfig = {
  // 是否启用监控
  enabled: true,

  // 日志上报 API 地址
  apiEndpoint: '/api/monitoring/log',

  // 采样率（0-1）
  sampleRate: 0.1,

  // 日志级别过滤
  minLevel: LogLevel.WARN,

  // 批量上报配置
  batch: {
    enabled: true,
    maxSize: 10,
    maxWaitTime: 5000,
  },

  // 性能监控配置
  performance: {
    enabled: true,
    collectPageLoad: true,
    collectAPI: true,
    collectLCP: true,
    collectFID: true,
    collectCLS: true,
  },

  // 错误监控配置
  error: {
    enabled: true,
    captureConsole: true,
    captureUnhandled: true,
    stackTrace: true,
    sourceMap: true,
  },

  // 用户行为监控配置
  behavior: {
    enabled: true,
    trackClicks: true,
    trackScroll: true,
    trackRoute: true,
  },
};
```

## 使用方法

### 自动集成

监控系统已自动集成到 `src/app/[locale]/layout.tsx` 中，无需额外配置即可工作。

### 手动记录日志

在业务代码中可以手动记录特定的事件：

```typescript
import { monitor } from '@/lib/monitoring';
import { LogType } from '@/config/monitoring';

// 记录 API 错误
monitor.logApiError('/api/login', error, {
  email: userEmail,
  errorType: 'authentication',
});

// 记录 API 性能
monitor.logApiPerformance('/api/market', duration, {
  endpoint: 'market',
  method: 'GET',
});

// 记录用户行为
monitor.logUserAction('click', 'buy-button', 'BTC/USDT');

// 记录业务事件
monitor.logBusinessEvent(LogType.AUTH_EVENT, 'User logged in', {
  userId: '12345',
  loginMethod: 'email',
});
```

## 日志查看

### 开发环境

访问以下 API 查看日志：

```bash
# 查看最近的日志
curl http://localhost:5000/api/monitoring/logs

# 查看特定数量的日志
curl "http://localhost:5000/api/monitoring/log?limit=100"
```

### 生产环境

直接查看服务器上的日志文件：

```bash
# 查看今天的日志
cat logs/monitoring/monitoring-$(date +%Y-%m-%d).log

# 查看错误日志
grep ERROR logs/monitoring/monitoring-*.log

# 查看最近 100 条日志
tail -n 100 logs/monitoring/monitoring-$(date +%Y-%m-%d).log

# 统计错误数量
grep ERROR logs/monitoring/monitoring-*.log | wc -l
```

## 日志格式

每条日志包含以下信息：

```
[2024-03-06T10:30:00.000Z] [ERROR] [js_error] User:user_12345 | Session:session_67890
  Message: Cannot read property 'x' of undefined
  URL: https://example.com/market
  Device: Chrome | desktop
  Error: TypeError - Cannot read property 'x' of undefined
  Stack: TypeError: Cannot read property 'x' of undefined...
  Extra: {"filename":"app/market/page.tsx","lineno":123}
----------------------------------------
```

## 数据分析建议

### 1. 错误分析
- 按错误类型分组，找出最常见的问题
- 按页面分组，找出问题最多的页面
- 按设备/浏览器分组，找出兼容性问题

### 2. 性能分析
- 查看 API 响应时间，识别慢接口
- 查看 LCP 指标，优化页面加载性能
- 查看 FID 指标，改善交互响应

### 3. 用户行为分析
- 分析用户访问路径，优化导航设计
- 统计功能使用频率，优先优化热门功能
- 识别用户流失点，改进用户体验

## 注意事项

1. **敏感信息过滤**
   - 系统会自动过滤 password、token、apiKey 等敏感字段
   - 手动记录时避免包含敏感信息

2. **采样率控制**
   - 生产环境建议使用 10% 采样率
   - 高流量期间可以降低采样率

3. **日志轮转**
   - 日志按天分割，便于管理和清理
   - 建议定期清理旧日志（保留最近 30 天）

4. **性能影响**
   - 监控系统经过优化，对性能影响极小
   - 批量上报机制减少请求次数
   - 采样率控制减少数据量

## 常见问题

### Q: 如何禁用监控？
A: 设置环境变量 `NEXT_PUBLIC_ENABLE_MONITORING=false`

### Q: 如何调整采样率？
A: 在 `.env.local` 中设置 `NEXT_PUBLIC_MONITORING_SAMPLE_RATE=0.5`

### Q: 生产环境如何查看日志？
A: 直接查看服务器上的 `logs/monitoring/` 目录

### Q: 日志文件太大怎么办？
A: 设置采样率或定期清理旧日志文件

## 最佳实践

1. **合理使用采样率**：生产环境建议 10%，开发环境 100%
2. **定期清理日志**：保留最近 30 天的日志
3. **关注错误率**：错误率超过 5% 时需要立即处理
4. **优化慢接口**：API 响应时间超过 2 秒需要优化
5. **监控 Web Vitals**：LCP < 2.5s, FID < 100ms, CLS < 0.1

## 扩展

如果需要将日志发送到外部服务（如 Sentry、LogRocket），可以修改 `monitoring.ts` 中的上报逻辑：

```typescript
// 上报到 Sentry
import * as Sentry from '@sentry/nextjs';

async function sendToSentry(logs: LogData[]) {
  for (const log of logs) {
    if (log.level === LogLevel.ERROR || log.level === LogLevel.FATAL) {
      Sentry.captureException(new Error(log.message), {
        extra: log,
      });
    }
  }
}
```
