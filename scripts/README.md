# 脚本使用文档

本目录包含用于维护交易平台数据库的自动化脚本。

## 脚本列表

### 1. update-prices.js - 价格更新脚本

**功能：**
- 自动生成并更新所有交易对的价格数据
- 模拟真实市场波动（±1%）
- 支持定期执行（默认每 1 分钟）

**使用方法：**
```bash
# 单次执行
node scripts/update-prices.js

# 定期执行（每 1 分钟）
node scripts/update-prices.js
# 脚本会自动每分钟运行一次
```

**支持的交易对（30个）：**
- 贵金属：XAUUSD, XAGUSD
- 加密货币：BTCUSD, ETHUSD, LTCUSD, SOLUSD, XRPUSD, DOGEUSD
- 外汇：EURUSD, GBPUSD, USDJPY, USDCHF, EURAUD, EURGBP, EURJPY, GBPAUD, GBPNZD, GBPJPY, AUDUSD, AUDJPY, NZDUSD, NZDJPY, CADJPY, CHFJPY
- 能源：NGAS, UKOIL, USOIL
- 指数：US500, ND25, AUS200

**输出示例：**
```
✅ XAUUSD: $5102.60 (volume: 110)
✅ BTCUSD: $67255.19 (volume: 13)
...
📊 Update summary:
   ✅ Success: 30/30
   ❌ Failed: 0/30
```

---

### 2. check-data-consistency.js - 数据一致性检查脚本

**功能：**
- 检查数据库中最新价格是否在合理范围内
- 检测价格异常（偏离基准价格超过 20%）
- 生成详细的一致性报告

**使用方法：**
```bash
node scripts/check-data-consistency.js
```

**检查标准：**
- **✅ OK**: 偏差 < 10%
- **⚠️ WARNING**: 偏差 10% - 20%
- **❌ CRITICAL**: 偏差 > 20%
- **❓ MISSING**: 数据库中无该交易对数据

**输出示例：**
```
Symbol    Latest         Base           Deviation      Status
────────────────────────────────────────────────────────────
XAUUSD    5100.00        5100.00        0.00%          ✅ OK
BTCUSD    67255.19       66500.00       1.14%          ✅ OK
...
📈 Summary:
   ✅ OK: 29/30
   ⚠️  WARNING: 1/30
   ❌ CRITICAL: 0/30
   ❓ MISSING: 0/30
```

---

## 部署建议

### 1. 使用 cron 定期执行

在服务器上设置 cron 任务：

```bash
# 编辑 crontab
crontab -e

# 添加以下行
# 每 5 分钟更新一次价格
*/5 * * * * cd /workspace/projects && node scripts/update-prices.js >> /var/log/price-updates.log 2>&1

# 每小时检查一次数据一致性
0 * * * * cd /workspace/projects && node scripts/check-data-consistency.js >> /var/log/data-consistency.log 2>&1
```

### 2. 使用 PM2 进程管理

```bash
# 安装 PM2
npm install -g pm2

# 启动价格更新服务
pm2 start scripts/update-prices.js --name price-updater

# 查看状态
pm2 status

# 查看日志
pm2 logs price-updater

# 设置开机自启
pm2 startup
pm2 save
```

### 3. 集成到 Next.js API

创建 API 路由 `/api/admin/price/update` 和 `/api/admin/price/check`，允许手动触发更新和检查。

---

## 配置说明

### 环境变量

脚本使用以下配置：

```javascript
const SUPABASE_URL = 'https://brfzboxaxknlypapwajy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o';
```

如需修改，请编辑脚本中的配置部分。

### 基准价格

基准价格定义在 `BASE_PRICES` 对象中，代表 2026 年 3 月的真实市场价格：

```javascript
const BASE_PRICES = {
  XAUUSD: 5100.00,
  BTCUSD: 66500.00,
  // ...
};
```

如需更新基准价格，请编辑此对象。

### 波动幅度

价格波动幅度在 `generatePrice()` 函数中定义：

```javascript
const volatility = symbol.includes('BTC') || symbol.includes('ETH') ? 0.02 : 0.01;
```

- 加密货币：±2%
- 其他交易对：±1%

---

## 监控和告警

建议设置以下监控：

1. **价格更新成功率**
   - 目标：> 95%
   - 告警：< 90%

2. **数据一致性**
   - 目标：所有交易对偏差 < 20%
   - 告警：存在 CRITICAL 级别问题

3. **数据库大小**
   - 定期清理旧数据（保留最近 30 天）

---

## 故障排查

### 问题 1: 脚本执行失败

**可能原因：**
- 网络连接问题
- Supabase API 限制

**解决方法：**
```bash
# 检查网络连接
ping brfzboxaxknlypapwajy.supabase.co

# 检查 API 密钥
echo $SUPABASE_ANON_KEY
```

### 问题 2: 价格异常

**可能原因：**
- 基准价格过时
- 市场波动超出预期

**解决方法：**
```bash
# 运行数据一致性检查
node scripts/check-data-consistency.js

# 如果发现异常，手动更新基准价格
```

### 问题 3: 数据库连接超时

**可能原因：**
- Supabase 服务器负载高
- 网络延迟

**解决方法：**
```bash
# 增加请求超时时间
# 在脚本中添加超时配置
```

---

## 联系支持

如有问题，请联系技术支持团队。
