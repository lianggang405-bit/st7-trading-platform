# 交易对同步与调控机器人更新

## ✅ 已完成的工作

### 1. 同步前端交易对到数据库

创建了同步 API：`/api/admin/trading/sync-pairs`

**同步的交易对（7个）：**
- BTC/USDT
- ETH/USDT
- BNB/USDT（新增）
- SOL/USDT（新增）
- DOGE/USDT（新增）
- XAU/USD
- XAU/USDT

**调用方式：**
```bash
curl -X POST http://localhost:5000/api/admin/trading/sync-pairs
```

### 2. 添加调控机器人新增按钮

**创建的组件：**
- `src/components/admin/AddPairDialog.tsx` - 新增交易对对话框

**更新的页面：**
- `src/app/admin/trading/bots/page.tsx` - 调控机器人页面

**功能：**
- ✅ 在调控机器人页面添加"新增交易对"按钮
- ✅ 点击按钮弹出对话框
- ✅ 支持输入交易对符号（格式：BASE/QUOTE）
- ✅ 选择货币 ID（1-7）
- ✅ 设置最小/最大订单量
- ✅ 设置手续费
- ✅ 是否启用交易对
- ✅ 表单验证
- ✅ 添加成功后自动刷新列表

### 3. 更新市场页面使用数据库交易对

**更新的页面：**
- `src/app/admin/market/page.tsx` - 市场调控页面

**功能：**
- ✅ 从数据库动态加载交易对列表
- ✅ 交易对选择器自动更新
- ✅ 只显示启用的交易对（is_visible = true）

---

## 📊 数据库状态

### trading_pairs 表
| ID | Symbol | Currency ID | Visible | Min Order | Max Order | Fee |
|----|--------|-------------|---------|-----------|-----------|-----|
| 1 | BTC/USDT | 1 | ✅ | 0.001 | 100 | 0.1 |
| 2 | ETH/USDT | 2 | ✅ | 0.01 | 1000 | 0.1 |
| 3 | XAU/USD | 3 | ✅ | 0.01 | 100 | 0.1 |
| 4 | XAU/USDT | 4 | ✅ | 0.01 | 100 | 0.1 |
| 15 | BNB/USDT | 5 | ✅ | 0.1 | 5000 | 0.1 |
| 16 | SOL/USDT | 6 | ✅ | 0.1 | 5000 | 0.1 |
| 17 | DOGE/USDT | 7 | ✅ | 10 | 1000000 | 0.1 |

---

## 🎯 使用指南

### 添加新交易对

1. 访问调控机器人页面：
   ```
   http://localhost:5000/admin/trading/bots
   ```

2. 点击右上角"新增交易对"按钮

3. 填写表单：
   - **交易对符号**：格式为 BASE/QUOTE（如：LTC/USDT）
   - **货币 ID**：选择 1-7 之间的数字
   - **最小订单量**：如 0.01
   - **最大订单量**：如 1000
   - **手续费**：如 0.1（0.1%）
   - **启用此交易对**：勾选

4. 点击"添加"按钮

5. 成功后，新交易对会自动出现在列表中

### 同步交易对

如果需要重新同步所有交易对：

```bash
curl -X POST http://localhost:5000/api/admin/trading/sync-pairs
```

或在浏览器访问：
```
http://localhost:5000/api/admin/trading/sync-pairs
```

---

## 🔧 技术细节

### AddPairDialog 组件

**位置：** `src/components/admin/AddPairDialog.tsx`

**表单验证：**
- 交易对格式验证（BASE/QUOTE）
- 最小订单量 > 0
- 最大订单量 > 最小订单量
- 手续费 0-100

**API 调用：**
- 方法：POST
- 端点：`/api/admin/trading/pairs`
- 数据格式：
```json
{
  "symbol": "LTC/USDT",
  "currency_id": 8,
  "is_visible": true,
  "min_order_size": 0.01,
  "max_order_size": 1000,
  "contract_fee": 0.1
}
```

### 市场页面动态加载

**API 调用：**
- 方法：GET
- 端点：`/api/admin/trading/pairs?limit=100`
- 过滤：只显示 is_visible = true 的交易对

---

## 📝 货币 ID 对照表

| ID | 名称 |
|----|------|
| 1 | BTC |
| 2 | ETH |
| 3 | Gold (USD) |
| 4 | Gold (USDT) |
| 5 | BNB |
| 6 | SOL |
| 7 | DOGE |

---

## 🎉 完成！

现在您可以：
1. ✅ 在调控机器人页面添加新交易对
2. ✅ 所有交易对已同步到数据库
3. ✅ 市场调控页面自动使用数据库中的交易对

**请刷新浏览器查看效果！** 🚀
