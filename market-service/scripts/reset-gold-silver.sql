-- 清空黄金白银的旧 K 线数据，让系统使用新的默认价格
-- 执行此 SQL 后，MockDataGenerator 会使用新的默认价格：
--   XAUUSD: $2750.00（2025年1月实际价格）
--   XAGUSD: $33.50（2025年1月实际价格）

DELETE FROM klines WHERE symbol IN ('XAUUSD', 'XAGUSD');

-- 验证删除结果
SELECT symbol, COUNT(*) as count FROM klines GROUP BY symbol ORDER BY symbol;
