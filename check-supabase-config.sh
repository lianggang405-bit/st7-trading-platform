#!/bin/bash

echo "========================================"
echo "  检查 Supabase 配置"
echo "========================================"
echo ""

# 检查 .env.local 文件
if [ ! -f .env.local ]; then
    echo "❌ .env.local 文件不存在"
    exit 1
fi

echo "✅ .env.local 文件存在"
echo ""

# 检查 Supabase URL
SUPABASE_URL=$(grep "COZE_SUPABASE_URL" .env.local | cut -d '=' -f2)

if [ -z "$SUPABASE_URL" ]; then
    echo "❌ COZE_SUPABASE_URL 未配置"
    exit 1
fi

echo "✅ COZE_SUPABASE_URL: $SUPABASE_URL"
echo ""

# 检查 anon key
ANON_KEY=$(grep "COZE_SUPABASE_ANON_KEY" .env.local | cut -d '=' -f2)

if [ -z "$ANON_KEY" ] || [ "$ANON_KEY" = "请在这里粘贴您的anon_key" ]; then
    echo "❌ COZE_SUPABASE_ANON_KEY 未配置或未更新"
    echo ""
    echo "请执行以下步骤："
    echo "1. 访问: https://app.supabase.com/project/brfzboxaxknlypapwajy"
    echo "2. 点击 Settings -> API"
    echo "3. 复制 anon key"
    echo "4. 执行: nano .env.local"
    echo "5. 粘贴 anon key 并保存"
    exit 1
fi

echo "✅ COZE_SUPABASE_ANON_KEY: ${ANON_KEY:0:20}..."
echo ""

# 检查服务是否运行
echo "检查服务状态..."
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo "✅ 服务正在运行 (端口 5000)"
else
    echo "❌ 服务未运行"
    echo ""
    echo "请启动服务："
    echo "coze dev"
    exit 1
fi

echo ""
echo "========================================"
echo "  测试 Supabase 连接"
echo "========================================"
echo ""

# 测试数据库连接
CHECK_RESULT=$(curl -s http://localhost:5000/api/admin/trading/check-db)
echo "数据库检查结果:"
echo "$CHECK_RESULT" | python3 -m json.tool 2>/dev/null || echo "$CHECK_RESULT"

echo ""
echo "========================================"
echo "  下一步"
echo "========================================"
echo ""

READY=$(echo "$CHECK_RESULT" | grep -o '"ready":[^,}]*' | cut -d ':' -f2)

if [ "$READY" = "true" ]; then
    echo "🎉 数据库配置完成！"
    echo ""
    echo "您可以访问："
    echo "- 设置页面: http://localhost:5000/admin/trading/setup"
    echo "- 调控机器人页面: http://localhost:5000/admin/trading/bots"
else
    echo "⚠️  数据库还需要配置"
    echo ""
    echo "请执行以下步骤："
    echo "1. 在 Supabase SQL Editor 中执行 SQL 创建表"
    echo "2. 等待 1-2 分钟"
    echo "3. 访问: http://localhost:5000/admin/trading/setup"
    echo "4. 点击 '刷新状态' 按钮"
fi

echo ""
