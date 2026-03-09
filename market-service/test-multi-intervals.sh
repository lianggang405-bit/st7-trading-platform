#!/bin/bash

# 多周期 K线测试脚本

BASE_URL="http://localhost:3000/tv"
SYMBOL="BTCUSDT"

echo "🧪 Testing Multi-Interval K-line Generation"
echo "=========================================="
echo ""

# 获取服务器时间
echo "1️⃣  Getting server time..."
TIME=$(curl -s "${BASE_URL}/time")
if [ -z "$TIME" ]; then
  echo "❌ Failed to get server time. Is the service running?"
  exit 1
fi
echo "✅ Server time: $(date -d @$TIME)"
echo ""

# 测试不同周期
INTERVALS=("1" "5" "15" "60" "240" "1D")

echo "2️⃣  Testing different intervals..."
echo ""

for RES in "${INTERVALS[@]}"; do
  echo "--- Interval: ${RES}m ---"

  # 计算查询时间范围
  TO=$TIME
  FROM=$((TIME - 3600))  # 1小时前

  # 调用 history API
  RESULT=$(curl -s "${BASE_URL}/history?symbol=${SYMBOL}&resolution=${RES}&from=${FROM}&to=${TO}")

  # 检查是否有数据
  if echo "$RESULT" | jq -e '.t' > /dev/null 2>&1; then
    COUNT=$(echo "$RESULT" | jq '.t | length')
    echo "✅ Found ${COUNT} K-line records"

    # 显示第一根和最后一根K线
    if [ "$COUNT" -gt 0 ]; then
      FIRST_T=$(echo "$RESULT" | jq '.t[0]')
      FIRST_O=$(echo "$RESULT" | jq '.o[0]')
      FIRST_H=$(echo "$RESULT" | jq '.h[0]')
      FIRST_L=$(echo "$RESULT" | jq '.l[0]')
      FIRST_C=$(echo "$RESULT" | jq '.c[0]')

      LAST_T=$(echo "$RESULT" | jq '.t[-1]')
      LAST_O=$(echo "$RESULT" | jq '.o[-1]')
      LAST_C=$(echo "$RESULT" | jq '.c[-1]')

      echo "   First: Time=$(date -d @$FIRST_T), O=$FIRST_O, C=$FIRST_C"
      echo "   Last:  Time=$(date -d @$LAST_T), O=$LAST_O, C=$LAST_C"
    fi
  else
    STATUS=$(echo "$RESULT" | jq -r '.s')
    echo "⚠️  No data (status: $STATUS)"
  fi
  echo ""
done

echo "3️⃣  Testing symbol info..."
SYMBOL_INFO=$(curl -s "${BASE_URL}/symbols?symbol=${SYMBOL}")
echo "$SYMBOL_INFO" | jq '.'
echo ""

echo "✅ Test completed!"
