# 30个交易对同步与删除功能

## ✅ 已完成的工作

### 1. 同步30个交易对到数据库

**创建的 API：** `/api/admin/trading/sync-all-pairs`

**交易对分类：**
- **加密货币（7个）**：BTC/USDT, ETH/USDT, BNB/USDT, SOL/USDT, DOGE/USDT, LTC/USDT, XRP/USDT
- **外汇（15个）**：XAU/USD, XAU/USDT, EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD, NZD/USD, EUR/GBP, EUR/JPY, GBP/JPY, EUR/CHF, GBP/CHF, AUD/JPY
- **指数和商品（8个）**：UK100, US30, US500, GER30, ND25, EUSTX50, NGAS, USOIL

**调用方式：**
```bash
curl -X POST http://localhost:5000/api/admin/trading/sync-all-pairs
```

### 2. 添加删除功能

**更新的文件：**
- `src/app/api/admin/trading/pairs/[id]/route.ts` - 修复 Supabase 客户端
- `src/app/admin/trading/bots/page.tsx` - 添加删除按钮和对话框

**功能：**
- ✅ 在每行交易对后面添加删除按钮（红色垃圾桶图标）
- ✅ 点击删除按钮弹出确认对话框
- ✅ 确认后删除交易对
- ✅ 删除成功后自动刷新列表
- ✅ 删除时显示加载状态

---

## 📊 数据库状态

### trading_pairs 表（30个交易对）

#### 加密货币（7个）
| ID | Symbol | Currency ID | Visible | Min Order | Max Order | Fee |
|----|--------|-------------|---------|-----------|-----------|-----|
| 1 | BTC/USDT | 1 | ✅ | 0.001 | 100 | 0.1 |
| 2 | ETH/USDT | 2 | ✅ | 0.01 | 1000 | 0.1 |
| 15 | BNB/USDT | 5 | ✅ | 0.1 | 5000 | 0.1 |
| 16 | SOL/USDT | 6 | ✅ | 0.1 | 5000 | 0.1 |
| 17 | DOGE/USDT | 7 | ✅ | 10 | 1000000 | 0.1 |
| 25 | LTC/USDT | 8 | ✅ | 0.1 | 10000 | 0.1 |
| 26 | XRP/USDT | 9 | ✅ | 1 | 500000 | 0.1 |

#### 外汇（15个）
| ID | Symbol | Currency ID | Visible | Min Order | Max Order | Fee |
|----|--------|-------------|---------|-----------|-----------|-----|
| 3 | XAU/USD | 3 | ✅ | 0.01 | 100 | 0.1 |
| 4 | XAU/USDT | 4 | ✅ | 0.01 | 100 | 0.1 |
| 29 | EUR/USD | 10 | ✅ | 0.01 | 100000 | 0 |
| 30 | GBP/USD | 11 | ✅ | 0.01 | 100000 | 0 |
| 31 | USD/JPY | 12 | ✅ | 0.01 | 100000 | 0 |
| 32 | USD/CHF | 13 | ✅ | 0.01 | 100000 | 0 |
| 33 | AUD/USD | 14 | ✅ | 0.01 | 100000 | 0 |
| 34 | USD/CAD | 15 | ✅ | 0.01 | 100000 | 0 |
| 35 | NZD/USD | 16 | ✅ | 0.01 | 100000 | 0 |
| 36 | EUR/GBP | 17 | ✅ | 0.01 | 100000 | 0 |
| 37 | EUR/JPY | 18 | ✅ | 0.01 | 100000 | 0 |
| 38 | GBP/JPY | 19 | ✅ | 0.01 | 100000 | 0 |
| 39 | EUR/CHF | 20 | ✅ | 0.01 | 100000 | 0 |
| 40 | GBP/CHF | 21 | ✅ | 0.01 | 100000 | 0 |
| 41 | AUD/JPY | 22 | ✅ | 0.01 | 100000 | 0 |

#### 指数和商品（8个）
| ID | Symbol | Currency ID | Visible | Min Order | Max Order | Fee |
|----|--------|-------------|---------|-----------|-----------|-----|
| 42 | UK100 | 23 | ✅ | 0.1 | 10000 | 0.01 |
| 43 | US30 | 24 | ✅ | 0.1 | 10000 | 0.01 |
| 44 | US500 | 25 | ✅ | 0.1 | 10000 | 0.01 |
| 45 | GER30 | 26 | ✅ | 0.1 | 10000 | 0.01 |
| 46 | ND25 | 27 | ✅ | 0.1 | 10000 | 0.01 |
| 47 | EUSTX50 | 28 | ✅ | 0.1 | 10000 | 0.01 |
| 48 | NGAS | 29 | ✅ | 0.1 | 10000 | 0.01 |
| 49 | USOIL | 30 | ✅ | 0.1 | 10000 | 0.01 |

---

## 🎯 功能演示

### 删除交易对

1. 访问调控机器人页面：
   ```
   http://localhost:5000/admin/trading/bots
   ```

2. 找到要删除的交易对

3. 点击右侧的红色删除按钮（垃圾桶图标）

4. 在确认对话框中查看交易对信息

5. 点击"确认删除"按钮

6. 删除成功后，列表自动刷新

### 同步交易对

如果需要重新同步所有30个交易对：

```bash
curl -X POST http://localhost:5000/api/admin/trading/sync-all-pairs
```

或在浏览器访问：
```
http://localhost:5000/api/admin/trading/sync-all-pairs
```

---

## 🔧 技术细节

### 删除功能实现

**API 端点：** `DELETE /api/admin/trading/pairs/{id}`

**请求示例：**
```bash
curl -X DELETE http://localhost:5000/api/admin/trading/pairs/1
```

**响应示例：**
```json
{
  "success": true,
  "message": "Trading pair deleted successfully"
}
```

### 删除对话框组件

使用 `AlertDialog` 组件实现确认对话框，包含：
- 警告信息
- 交易对符号显示
- 取消按钮
- 确认删除按钮（红色主题）
- 加载状态显示

---

## 📝 交易对参数说明

### 最小/最大订单量
- **加密货币**：通常 0.001 - 1000000
- **外汇**：通常 0.01 - 100000
- **指数/商品**：通常 0.1 - 10000

### 手续费
- **加密货币**：0.1%
- **外汇**：0%（特殊设置）
- **指数/商品**：0.01%

### 货币 ID 对照表

| ID | 名称 |
|----|------|
| 1 | BTC |
| 2 | ETH |
| 3 | Gold (USD) |
| 4 | Gold (USDT) |
| 5 | BNB |
| 6 | SOL |
| 7 | DOGE |
| 8 | LTC |
| 9 | XRP |
| 10-22 | 外汇货币对 |
| 23-30 | 指数和商品 |

---

## 🎉 完成！

现在您可以：
1. ✅ 看到所有30个交易对
2. ✅ 使用删除按钮删除不需要的交易对
3. ✅ 使用新增交易对按钮添加新的交易对
4. ✅ 管理调控机器人的启用/禁用状态

**请刷新浏览器查看效果！** 🚀
