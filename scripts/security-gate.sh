#!/bin/bash
# 发布前安全门禁检查
# 在 CI/CD 中运行，确保满足安全要求

set -e

echo "=========================================="
echo "安全门禁检查"
echo "=========================================="

# 检查 1: JWT 环境变量必须配置
echo ""
echo "[检查 1/4] JWT 环境变量..."
if [ -z "$JWT_USER_SECRET" ]; then
  echo "❌ JWT_USER_SECRET 未配置"
  exit 1
fi
if [ ${#JWT_USER_SECRET} -lt 32 ]; then
  echo "❌ JWT_USER_SECRET 长度不足 32 字符"
  exit 1
fi
echo "✅ JWT_USER_SECRET 已配置"

if [ -z "$JWT_ADMIN_SECRET" ]; then
  echo "❌ JWT_ADMIN_SECRET 未配置"
  exit 1
fi
if [ ${#JWT_ADMIN_SECRET} -lt 32 ]; then
  echo "❌ JWT_ADMIN_SECRET 长度不足 32 字符"
  exit 1
fi
echo "✅ JWT_ADMIN_SECRET 已配置"

# 检查 2: 密钥不能相同
echo ""
echo "[检查 2/4] 密钥分离检查..."
if [ "$JWT_USER_SECRET" = "$JWT_ADMIN_SECRET" ]; then
  echo "❌ JWT_USER_SECRET 和 JWT_ADMIN_SECRET 不能相同"
  exit 1
fi
echo "✅ 密钥已分离"

# 检查 3: 不存在默认凭据
echo ""
echo "[检查 3/4] 默认凭据检查..."
if grep -r "admin123\|password123" src/ 2>/dev/null; then
  echo "❌ 发现默认凭据"
  exit 1
fi
echo "✅ 无默认凭据"

# 检查 4: TypeScript 编译通过
echo ""
echo "[检查 4/4] TypeScript 编译..."
pnpm ts-check
echo "✅ TypeScript 编译通过"

echo ""
echo "=========================================="
echo "✅ 所有安全门禁检查通过"
echo "=========================================="
