#!/bin/bash
#
# Redis 备份脚本
# 用途：备份 Redis 数据
#

BACKUP_DIR="/tmp/redis-backup"
DATE=$(date +%Y%m%d_%H%M%S)

echo "💾 Redis Backup"
echo "================================"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份 RDB 文件
if [ -f "/tmp/dump.rdb" ]; then
    cp /tmp/dump.rdb $BACKUP_DIR/dump_$DATE.rdb
    echo "✅ RDB backup: $BACKUP_DIR/dump_$DATE.rdb"
else
    echo "ℹ️ No RDB file found"
fi

# 备份 AOF 文件
if [ -f "/tmp/appendonly.aof" ]; then
    cp /tmp/appendonly.aof $BACKUP_DIR/aof_$DATE.aof
    echo "✅ AOF backup: $BACKUP_DIR/aof_$DATE.aof"
else
    echo "ℹ️ No AOF file found"
fi

# 清理旧备份（保留最近 7 天）
echo "🧹 Cleaning old backups..."
find $BACKUP_DIR -type f -mtime +7 -delete

# 显示备份列表
echo ""
echo "📁 Backup History:"
ls -lh $BACKUP_DIR | tail -5

echo ""
echo "✅ Backup completed: $BACKUP_DIR/$DATE"
