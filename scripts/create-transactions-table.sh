#!/bin/bash

# 创建交易流水表的脚本

SUPABASE_URL="https://brfzboxaxknlypapwajy.supabase.co"
SUPABASE_KEY="sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o"

# 创建表
curl -s -X POST "${SUPABASE_URL}/rest/v1/transactions" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{"id": 0}' 2>/dev/null

echo "Table creation attempted. Please verify in Supabase dashboard."
