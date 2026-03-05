-- 修复用户余额不一致问题
-- 将 user_wallets 表的余额同步到 users 表

-- 更新 users 表的余额，从 user_wallets 的 formal 账户获取
UPDATE users u
SET balance = uw.balance,
    updated_at = NOW()
FROM user_wallets uw
WHERE u.id = uw.user_id
  AND uw.account_type = 'formal'
  AND u.balance IS DISTINCT FROM uw.balance;

-- 查看更新结果
SELECT
    u.id,
    u.email,
    u.balance::text as user_balance,
    uw.balance::text as wallet_balance,
    uw.account_type
FROM users u
LEFT JOIN user_wallets uw ON u.id = uw.user_id AND uw.account_type = 'formal'
ORDER BY u.id
LIMIT 10;

-- 验证：检查用户余额和入金总额是否一致
SELECT
    u.id,
    u.email,
    u.balance::text as user_balance,
    uw.balance::text as wallet_balance,
    uw.total_deposit::text as total_deposit
FROM users u
LEFT JOIN user_wallets uw ON u.id = uw.user_id AND uw.account_type = 'formal'
WHERE u.id IN (SELECT DISTINCT user_id FROM deposit_requests WHERE status = 'approved')
ORDER BY u.id;
