# GoldAPI 配置说明

## API 密钥

GoldAPI 提供免费的贵金属实时数据服务，支持黄金（XAU）、白银（XAG）、钯金（XPD）、铂金（XPT）等。

### 当前配置

API 密钥已配置在代码中：
```
goldapi-445bbsmmle9lsi-io
```

### 环境变量（可选）

如果你想使用环境变量，可以在 `.env.local` 文件中添加：

```bash
NEXT_PUBLIC_GOLDAPI_KEY=goldapi-445bbsmmle9lsi-io
```

## API 文档

- 官方网站：https://www.goldapi.io/
- API 文档：https://www.goldapi.io/documentation
- 示例端点：
  - 当前价格：https://api.goldapi.io/api/XAU/USD
  - 历史K线：https://api.goldapi.io/api/XAU/USD/1h

## 支持的金属

- **XAU**：黄金
- **XAG**：白银
- **XPD**：钯金
- **XPT**：铂金

## 支持的货币

- USD（美元）
- EUR（欧元）
- GBP（英镑）
- AUD（澳元）
- CAD（加元）
- JPY（日元）
- CHF（瑞士法郎）

## 支持的时间周期

- **1m**：1分钟
- **5m**：5分钟
- **15m**：15分钟
- **1h**：1小时
- **4h**：4小时
- **1d**：1天

## 免费版限制

- 每月请求次数：100次
- 延迟：实时
- 支持的历史数据：有限

## 使用示例

```typescript
// 获取当前价格
const price = await getRealPreciousMetalPrice('XAUUSD')
// 返回：{ symbol: 'XAUUSD', price: 5200.99, timestamp: 1678767600 }

// 获取历史K线
const klines = await fetchGoldAPIKlines('XAUUSD', '1h', 200)
// 返回：[{ time: 1678767600, open: 5190, high: 5223, low: 5183, close: 5200, volume: 0 }, ...]
```

## 数据源优先级

1. GoldAPI（真实数据）
2. Finnhub API
3. Kraken API
4. Twelve Data API
5. Yahoo Finance API
6. 优化后的模拟数据

## 故障排除

如果 GoldAPI 请求失败：

1. 检查 API 密钥是否正确
2. 检查网络连接
3. 检查 API 配额是否用完
4. 查看浏览器控制台错误信息

系统会自动降级到备用数据源，确保功能正常运行。
