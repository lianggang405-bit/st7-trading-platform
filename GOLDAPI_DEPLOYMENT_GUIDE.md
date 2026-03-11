# GoldAPI 集成部署验证指南

## 📋 部署前检查清单

### 1. 环境变量配置
确保以下环境变量已正确设置：

```bash
# .env.local 或 .env.production
NEXT_PUBLIC_GOLDAPI_KEY=goldapi-445bbsmmle9lsi-io
```

### 2. 网络访问权限
确保服务器可以访问：
- `https://api.goldapi.io` (端口 443)
- 无防火墙或代理限制

### 3. API 密钥验证
你的 GoldAPI 密钥：`goldapi-445bbsmmle9lsi-io`

---

## 🔍 部署后验证步骤

### 步骤 1: 验证服务端代理 API

```bash
curl "https://your-domain.com/api/goldapi-klines?symbol=XAUUSD&interval=1h&limit=5"
```

**预期成功响应：**
```json
{
  "success": true,
  "symbol": "XAUUSD",
  "interval": "1h",
  "count": 5,
  "klines": [
    {
      "time": 1678767600,
      "open": 5200.50,
      "high": 5210.25,
      "low": 5195.75,
      "close": 5205.30,
      "volume": 12345
    }
  ]
}
```

**如果失败，检查：**
- 服务器日志：`tail -f /var/log/your-app.log`
- 网络连接：`curl https://api.goldapi.io/api/XAU/USD`
- API 密钥是否正确

### 步骤 2: 验证当前价格 API

```bash
curl "https://your-domain.com/api/real-precious-metals?symbol=XAUUSD"
```

**预期成功响应：**
```json
{
  "success": true,
  "symbol": "XAUUSD",
  "price": 5200.99,
  "priceTimestamp": 1678767600
}
```

### 步骤 3: 验证 K线数据质量

```bash
curl "https://your-domain.com/api/debug-kline?symbol=XAUUSD"
```

**预期成功响应：**
```json
{
  "success": true,
  "symbol": "XAUUSD",
  "count": 10,
  "statistics": {
    "priceRange": {
      "min": 5185.00,
      "max": 5215.00,
      "range": 30.00,
      "rangePercent": "0.58%"
    },
    "klineMetrics": {
      "isWallLike": false,
      "bodyToRangeRatio": 0.35
    }
  },
  "issues": null
}
```

### 步骤 4: 检查前端页面

1. 打开浏览器访问交易页面
2. 选择黄金（XAUUSD）交易对
3. 观察 K线图是否正常显示
4. 检查浏览器控制台，确保无 CORS 错误

---

## 🛠️ 故障排查

### 问题 1: 返回空数据 `{ "count": 0, "klines": [] }`

**可能原因：**
- API 密钥无效或过期
- 网络无法访问 `api.goldapi.io`
- API 服务暂时不可用

**解决方案：**
1. 验证 API 密钥：访问 https://www.goldapi.io/ 检查账户状态
2. 测试网络连接：
   ```bash
   curl -H "x-access-token: goldapi-445bbsmmle9lsi-io" \
        https://api.goldapi.io/api/XAU/USD
   ```
3. 检查服务器防火墙规则

### 问题 2: 返回 HTTP 401 或 403

**可能原因：**
- API 密钥错误
- API 密钥权限不足

**解决方案：**
1. 确认环境变量正确设置
2. 重新部署应用
3. 联系 GoldAPI 支持

### 问题 3: CORS 错误（浏览器控制台）

**可能原因：**
- 服务端代理 API 未正确部署
- Nginx/反向代理配置错误

**解决方案：**
1. 确认 `/api/goldapi-klines` 端点可访问
2. 检查 Nginx 配置，确保 `/api/*` 路由正确
3. 查看服务器日志确认请求是否到达服务端

---

## 📊 数据源优先级

系统会按以下顺序尝试获取数据：

1. **GoldAPI**（真实数据，优先）
   - URL: `https://api.goldapi.io/api/{METAL}/USD/{INTERVAL}`
   - 延迟: 100-500ms
   - 数据: 实时贵金属价格和K线数据

2. **Finnhub API**（备用）
   - 如果 GoldAPI 失败，自动切换

3. **Kraken API**（备用）
   - 如果 Finnhub 失败，自动切换

4. **Twelve Data**（备用）
   - 如果 Kraken 失败，自动切换

5. **Yahoo Finance**（备用）
   - 如果 Twelve Data 失败，自动切换

6. **模拟数据**（最终降级）
   - 基于真实市场价格
   - 符合真实市场特征
   - 确保系统始终可用

---

## 📝 重要提示

### API 使用限制
- **免费计划**：每日 100 次请求
- **超时设置**：5秒
- **缓存策略**：no-store（实时数据）

### 生产环境建议
1. **监控 API 调用量**：避免超出免费计划限制
2. **实现速率限制**：保护 API 密钥不被滥用
3. **缓存优化**：考虑 Redis 缓存短期数据
4. **日志记录**：记录 API 调用和错误信息

### 性能优化
- 使用 WebSocket 实时推送（后续实现）
- 实现服务端缓存
- 合并多个请求为批量请求

---

## ✅ 验证成功标志

当所有检查通过时，你应该看到：

✅ 服务端 API 返回真实 K线数据（count > 0）
✅ 前端 K线图正常显示，不是"墙一样铺满"
✅ 价格基于真实市场数据（约 5200）
✅ 浏览器控制台无 CORS 错误
✅ 服务器日志显示 `[GoldAPI Proxy] 获取到 N 条K线数据`

如果所有标志都显示 ✅，恭喜你，GoldAPI 集成成功！
