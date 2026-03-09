#!/bin/bash

# 启动 Market Service（确保环境变量正确加载）

cd /workspace/projects/market-service

# 加载环境变量
export SUPABASE_URL=$(grep SUPABASE_URL .env | cut -d '=' -f2)
export SUPABASE_SERVICE_ROLE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env | cut -d '=' -f2)

# 使用 pnpm 运行
pnpm run dev
