#!/bin/bash

echo "========================================"
echo "  妫€鏌?Supabase 閰嶇疆"
echo "========================================"
echo ""

# 妫€鏌?.env.local 鏂囦欢
if [ ! -f .env.local ]; then
    echo "鉂?.env.local 鏂囦欢涓嶅瓨鍦?
    exit 1
fi

echo "鉁?.env.local 鏂囦欢瀛樺湪"
echo ""

# 妫€鏌?Supabase URL
SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d '=' -f2)

if [ -z "$SUPABASE_URL" ]; then
    echo "鉂?NEXT_PUBLIC_SUPABASE_URL 鏈厤缃?
    exit 1
fi

echo "鉁?NEXT_PUBLIC_SUPABASE_URL: $SUPABASE_URL"
echo ""

# 妫€鏌?anon key
ANON_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local | cut -d '=' -f2)

if [ -z "$ANON_KEY" ] || [ "$ANON_KEY" = "璇峰湪杩欓噷绮樿创鎮ㄧ殑anon_key" ]; then
    echo "鉂?NEXT_PUBLIC_SUPABASE_ANON_KEY 鏈厤缃垨鏈洿鏂?
    echo ""
    echo "璇锋墽琛屼互涓嬫楠わ細"
    echo "1. 璁块棶: https://app.supabase.com/project/brfzboxaxknlypapwajy"
    echo "2. 鐐瑰嚮 Settings -> API"
    echo "3. 澶嶅埗 anon key"
    echo "4. 鎵ц: nano .env.local"
    echo "5. 绮樿创 anon key 骞朵繚瀛?
    exit 1
fi

echo "鉁?NEXT_PUBLIC_SUPABASE_ANON_KEY: ${ANON_KEY:0:20}..."
echo ""

# 妫€鏌ユ湇鍔℃槸鍚﹁繍琛?echo "妫€鏌ユ湇鍔＄姸鎬?.."
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo "鉁?鏈嶅姟姝ｅ湪杩愯 (绔彛 5000)"
else
    echo "鉂?鏈嶅姟鏈繍琛?
    echo ""
    echo "璇峰惎鍔ㄦ湇鍔★細"
    echo "coze dev"
    exit 1
fi

echo ""
echo "========================================"
echo "  娴嬭瘯 Supabase 杩炴帴"
echo "========================================"
echo ""

# 娴嬭瘯鏁版嵁搴撹繛鎺?CHECK_RESULT=$(curl -s http://localhost:5000/api/admin/trading/check-db)
echo "鏁版嵁搴撴鏌ョ粨鏋?"
echo "$CHECK_RESULT" | python3 -m json.tool 2>/dev/null || echo "$CHECK_RESULT"

echo ""
echo "========================================"
echo "  涓嬩竴姝?
echo "========================================"
echo ""

READY=$(echo "$CHECK_RESULT" | grep -o '"ready":[^,}]*' | cut -d ':' -f2)

if [ "$READY" = "true" ]; then
    echo "馃帀 鏁版嵁搴撻厤缃畬鎴愶紒"
    echo ""
    echo "鎮ㄥ彲浠ヨ闂細"
    echo "- 璁剧疆椤甸潰: http://localhost:5000/admin/trading/setup"
    echo "- 璋冩帶鏈哄櫒浜洪〉闈? http://localhost:5000/admin/trading/bots"
else
    echo "鈿狅笍  鏁版嵁搴撹繕闇€瑕侀厤缃?
    echo ""
    echo "璇锋墽琛屼互涓嬫楠わ細"
    echo "1. 鍦?Supabase SQL Editor 涓墽琛?SQL 鍒涘缓琛?
    echo "2. 绛夊緟 1-2 鍒嗛挓"
    echo "3. 璁块棶: http://localhost:5000/admin/trading/setup"
    echo "4. 鐐瑰嚮 '鍒锋柊鐘舵€? 鎸夐挳"
fi

echo ""

