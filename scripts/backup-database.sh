#!/bin/bash

# ST7 交易平台数据库备份脚本
# 使用方法: ./backup-database.sh

set -e

# 配置
BACKUP_DIR="/var/backups/st7-trading-platform"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="st7_backup_${TIMESTAMP}.sql"

# 从环境变量读取数据库配置
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-"trading_platform"}
DB_USER=${DB_USER:-"postgres"}

# 创建备份目录
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] 开始数据库备份..."

# 备份数据库
if [ -n "${DB_PASSWORD}" ]; then
  PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -f "${BACKUP_DIR}/${BACKUP_FILE}" \
    --no-password \
    --verbose 2>&1 | tee "${BACKUP_DIR}/backup_${TIMESTAMP}.log"
else
  pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -f "${BACKUP_DIR}/${BACKUP_FILE}" \
    --verbose 2>&1 | tee "${BACKUP_DIR}/backup_${TIMESTAMP}.log"
fi

# 压缩备份文件
echo "[$(date)] 压缩备份文件..."
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# 检查备份是否成功
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}.gz" ]; then
  echo "[$(date)] 数据库备份成功: ${BACKUP_DIR}/${BACKUP_FILE}.gz"
  
  # 获取文件大小
  FILE_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}.gz" | cut -f1)
  echo "[$(date)] 备份文件大小: ${FILE_SIZE}"
else
  echo "[$(date)] 数据库备份失败!"
  exit 1
fi

# 清理旧备份
echo "[$(date)] 清理 ${RETENTION_DAYS} 天前的备份..."
find "${BACKUP_DIR}" -name "st7_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find "${BACKUP_DIR}" -name "backup_*.log" -mtime +${RETENTION_DAYS} -delete

# 清理空文件
find "${BACKUP_DIR}" -type f -empty -delete

echo "[$(date)] 备份完成!"
