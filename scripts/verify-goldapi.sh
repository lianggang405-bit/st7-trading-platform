#!/bin/bash

# GoldAPI 集成验证脚本
# 使用方法: bash scripts/verify-goldapi.sh

echo "=================================="
echo "  GoldAPI 集成验证工具"
echo "=================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 默认域名（可以通过参数覆盖）
DOMAIN="${1:-http://localhost:5000}"
API_KEY="${2:-goldapi-445bbsmmle9lsi-io}"

echo "📍 配置信息:"
echo "   域名: $DOMAIN"
echo "   API 密钥: ${API_KEY:0:10}..."
echo ""

# 测试 1: 直接测试 GoldAPI
echo "🔍 测试 1: 直接测试 GoldAPI 连接"
echo "----------------------------------"
DIRECT_RESULT=$(curl -s \
  -H "x-access-token: $API_KEY" \
  -H "Content-Type: application/json" \
  "https://api.goldapi.io/api/XAU/USD" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$DIRECT_RESULT" | grep "HTTP_CODE" | cut -d: -f2)
RESPONSE_BODY=$(echo "$DIRECT_RESULT" | grep -v "HTTP_CODE")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 直接连接成功${NC}"
    echo "   响应: $RESPONSE_BODY"
else
    echo -e "${RED}❌ 直接连接失败 (HTTP $HTTP_CODE)${NC}"
    echo "   响应: $RESPONSE_BODY"
    echo ""
    echo -e "${YELLOW}⚠️  可能原因：${NC}"
    echo "   - API 密钥无效或过期"
    echo "   - 网络无法访问 api.goldapi.io"
    echo "   - 防火墙阻止 HTTPS 连接"
fi
echo ""

# 测试 2: 测试服务端代理 API
echo "🔍 测试 2: 测试服务端代理 API"
echo "----------------------------------"
PROXY_RESULT=$(curl -s \
  "$DOMAIN/api/goldapi-klines?symbol=XAUUSD&interval=1h&limit=5")

PROXY_COUNT=$(echo "$PROXY_RESULT" | grep -o '"count":[0-9]*' | cut -d: -f2)

if [ ! -z "$PROXY_COUNT" ] && [ "$PROXY_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ 服务端代理正常工作${NC}"
    echo "   获取到 $PROXY_COUNT 条K线数据"
else
    echo -e "${YELLOW}⚠️  服务端代理返回空数据${NC}"
    echo "   响应: $PROXY_RESULT"
fi
echo ""

# 测试 3: 测试当前价格 API
echo "🔍 测试 3: 测试当前价格 API"
echo "----------------------------------"
PRICE_RESULT=$(curl -s "$DOMAIN/api/real-precious-metals?symbol=XAUUSD")
PRICE_VALUE=$(echo "$PRICE_RESULT" | grep -o '"price":[0-9.]*' | cut -d: -f2)

if [ ! -z "$PRICE_VALUE" ] && [ "$PRICE_VALUE" != "null" ] && [ "$PRICE_VALUE" != "0" ]; then
    echo -e "${GREEN}✅ 当前价格获取成功${NC}"
    echo "   黄金价格: \$${PRICE_VALUE}"
else
    echo -e "${YELLOW}⚠️  当前价格为空或零${NC}"
    echo "   响应: $PRICE_RESULT"
fi
echo ""

# 测试 4: 测试 K线数据质量
echo "🔍 测试 4: 测试 K线数据质量"
echo "----------------------------------"
DEBUG_RESULT=$(curl -s "$DOMAIN/api/debug-kline?symbol=XAUUSD")

# 检查是否有问题
ISSUES=$(echo "$DEBUG_RESULT" | grep -o '"issues":null')

if [ ! -z "$ISSUES" ]; then
    echo -e "${GREEN}✅ K线数据质量良好${NC}"
    
    # 提取统计信息
    BODY_RATIO=$(echo "$DEBUG_RESULT" | grep -o '"bodyToRangeRatio":[0-9.]*' | cut -d: -f2)
    IS_WALL=$(echo "$DEBUG_RESULT" | grep -o '"isWallLike":true' || echo "false")
    
    echo "   实体占比: $BODY_RATIO"
    if [ "$IS_WALL" = "false" ]; then
        echo "   -e ${GREEN}   ✅ 不是'墙一样铺满'${NC}"
    else
        echo -e "${RED}   ❌ 警告：K线图可能显示异常${NC}"
    fi
else
    echo -e "${RED}❌ K线数据存在质量问题${NC}"
    echo "   响应: $DEBUG_RESULT"
fi
echo ""

# 总结
echo "=================================="
echo "  验证总结"
echo "=================================="

# 统计通过/失败
PASS_COUNT=0
FAIL_COUNT=0

# 简单统计
if [ "$HTTP_CODE" = "200" ]; then
    PASS_COUNT=$((PASS_COUNT + 1))
else
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

if [ ! -z "$PROXY_COUNT" ] && [ "$PROXY_COUNT" -gt 0 ]; then
    PASS_COUNT=$((PASS_COUNT + 1))
else
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

if [ ! -z "$PRICE_VALUE" ] && [ "$PRICE_VALUE" != "null" ] && [ "$PRICE_VALUE" != "0" ]; then
    PASS_COUNT=$((PASS_COUNT + 1))
else
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

if [ ! -z "$ISSUES" ]; then
    PASS_COUNT=$((PASS_COUNT + 1))
else
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

TOTAL_COUNT=$((PASS_COUNT + FAIL_COUNT))

echo "通过: $PASS_COUNT / $TOTAL_COUNT"
echo "失败: $FAIL_COUNT / $TOTAL_COUNT"
echo ""

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！GoldAPI 集成正常工作${NC}"
    exit 0
elif [ "$FAIL_COUNT" -eq 1 ]; then
    echo -e "${YELLOW}⚠️  部分测试失败，请检查上述日志${NC}"
    exit 1
else
    echo -e "${RED}❌ 多个测试失败，需要排查问题${NC}"
    echo ""
    echo "建议操作："
    echo "1. 检查服务器网络连接"
    echo "2. 验证 API 密钥是否正确"
    echo "3. 查看 GOLDAPI_DEPLOYMENT_GUIDE.md 获取详细帮助"
    exit 2
fi
