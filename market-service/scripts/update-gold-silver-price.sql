-- 更新黄金白银最后一根 K 线的价格为 2025年1月实际价格
-- 保留历史数据，只更新最后一根 K 线

-- 更新黄金（XAUUSD）最后一根 K 线
UPDATE klines
SET
  open = 2750.00,
  high = 2755.00,
  low = 2745.00,
  close = 2750.00
WHERE symbol = 'XAUUSD'
  AND open_time = (
    SELECT open_time FROM klines
    WHERE symbol = 'XAUUSD'
    ORDER BY open_time DESC
    LIMIT 1
  );

-- 更新白银（XAGUSD）最后一根 K 线
UPDATE klines
SET
  open = 33.50,
  high = 33.60,
  low = 33.40,
  close = 33.50
WHERE symbol = 'XAGUSD'
  AND open_time = (
    SELECT open_time FROM klines
    WHERE symbol = 'XAGUSD'
    ORDER BY open_time DESC
    LIMIT 1
  );

-- 验证更新结果
SELECT symbol, open, high, low, close, open_time
FROM klines
WHERE symbol IN ('XAUUSD', 'XAGUSD')
ORDER BY symbol, open_time DESC
LIMIT 10;
