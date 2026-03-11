# 🚀 部署后快速验证指南

## 第一步：验证 GoldAPI 直接连接

在服务器上运行以下命令：

```bash
curl -H "x-access-token: goldapi-445bbsmmle9lsi-io" \
     https://api.goldapi.io/api/XAU/USD
```

**预期成功响应：**
```json
{
  "timestamp": 1772620200000,
  "metal": "XAU",
  "exchange": "LBMA",
  "currency": "USD",
  "price": 5200.99,
  "prev_close_price": 5195.50,
  "ch": 5.49,
  "chp": 0.1056,
  "price_gram_24k": 167.1234,
  ...
}
```

**如果失败：**
- 检查网络连接：`ping api.goldapi.io`
- 检查防火墙规则
- 验证 API 密钥是否有效

---

## 第二步：运行自动验证脚本

```bash
bash scripts/verify-goldapi.sh
```

**预期输出：**
```
==================================
  GoldAPI 集成验证工具
==================================

📍 配置信息:
   域名: https://your-domain.com
   API 密钥: goldapi-445b...

🔍 测试 1: 直接测试 GoldAPI 连接
----------------------------------
✅ 直接连接成功
   响应: {"price":5200.99,...}

🔍 测试 2: 测试服务端代理 API
----------------------------------
✅ 服务端代理正常工作
   获取到 5 条K线数据

🔍 测试 3: 测试当前价格 API
----------------------------------
✅ 当前价格获取成功
   黄金价格: $5200.99

🔍 测试 4: 测试 K线数据质量
----------------------------------
✅ K线数据质量良好
   实体占比: 0.38
   ✅ 不是'墙一样铺满'

==================================
  验证总结
==================================
通过: 4 / 4
失败: 0 / 4

🎉 所有测试通过！GoldAPI 集成正常工作
```

---

## 第三步：检查服务器日志

```bash
# 查看 GoldAPI 相关日志
tail -f /var/log/your-app.log | grep GoldAPI
```

**正常日志应该包含：**
```
[GoldAPI Klines] 开始请求: XAU/1h (limit: 200)
[GoldAPI Klines] 请求 URL: https://api.goldapi.io/api/XAU/USD/1h
[GoldAPI Klines] API 密钥: goldapi-445b...
[GoldAPI Klines] HTTP 状态: 200 OK
[GoldAPI Klines] 响应类型: 数组
[GoldAPI Klines] 成功获取 200 条K线数据
[GoldAPI Klines] 返回 200 条K线数据
[KlineDataSource] 从 GoldAPI 获取 200 条数据
```

**如果看到错误：**
```
[GoldAPI Klines] HTTP 状态: 401 Unauthorized
[GoldAPI Klines] HTTP 错误响应: {"error":"Invalid API key"}
```
→ 检查 API 密钥是否正确

```
[GoldAPI Klines] 请求失败: TypeError: Failed to fetch
[GoldAPI Klines] 错误详情: fetch failed
```
→ 检查服务器网络连接

---

## 第四步：验证前端页面

1. 打开浏览器访问交易页面
2. 选择黄金（XAUUSD）交易对
3. 观察以下指标：

### ✅ 正常显示的标志
- K线图正常显示，不是一片红色或"墙一样铺满"
- 价格显示约为 $5200（黄金）或 $29.5（白银）
- K线有自然的上下影线
- 浏览器控制台 **无 CORS 错误**

### ❌ 异常显示的标志
- K线图显示为一片红色
- 所有K线都一样长（"墙一样铺满"）
- 价格异常（如 $2900 而非 $5200）
- 浏览器控制台有 CORS 错误

---

## 常见问题快速解决

### 问题 1: "Failed to fetch" 错误

**解决方案：**
```bash
# 检查网络连接
curl -I https://api.goldapi.io

# 如果失败，检查防火墙
sudo iptables -L -n | grep 443

# 如果需要，添加防火墙规则
sudo iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --sport 443 -j ACCEPT
```

### 问题 2: 返回 401 Unauthorized

**解决方案：**
```bash
# 检查环境变量
echo $NEXT_PUBLIC_GOLDAPI_KEY

# 如果未设置或错误，重新设置
export NEXT_PUBLIC_GOLDAPI_KEY=goldapi-445bbsmmle9lsi-io

# 重启应用
pm2 restart your-app
```

### 问题 3: 返回空数据

**解决方案：**
1. 访问 https://www.goldapi.io/ 检查 API 密钥状态
2. 确认账户有足够的使用配额（免费计划：每日 100 次）
3. 检查 API 服务是否正常运行

---

## 性能监控

### 监控 API 调用量

```bash
# 统计最近一小时的 API 调用次数
grep "\[GoldAPI Klines\]" /var/log/your-app.log | \
  awk 'BEGIN{count=0} {count++} END{print count}'
```

### 监控响应时间

```bash
# 统计平均响应时间
grep "\[GoldAPI Klines\]" /var/log/your-app.log | \
  grep "成功获取" | \
  awk '{sum+=$4; count++} END{print "平均响应:", sum/count, "ms"}'
```

---

## ✅ 最终确认清单

部署完成后，确认以下所有项：

- [ ] GoldAPI 直接连接成功
- [ ] 服务端代理 API 正常工作
- [ ] 当前价格显示正确（黄金约 $5200）
- [ ] K线图正常显示，不是"墙"
- [ ] 浏览器控制台无 CORS 错误
- [ ] 服务器日志显示成功获取数据
- [ ] 验证脚本全部通过

如果所有项都已确认，恭喜你！🎉 GoldAPI 集成成功，系统正常运行。

---

## 📞 获取帮助

如果遇到问题：

1. 查看 `GOLDAPI_DEPLOYMENT_GUIDE.md` 详细文档
2. 检查服务器日志获取详细错误信息
3. 运行验证脚本诊断问题
4. 访问 GoldAPI 官方文档：https://www.goldapi.io/documentation

**重要提示：**
- 免费计划限制：每日 100 次请求
- 超时设置：5 秒
- 缓存策略：no-store（实时数据）
- 降级策略：如果 GoldAPI 失败，自动降级到备用数据源
