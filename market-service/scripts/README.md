# Market Service 运维脚本使用指南

## 📁 脚本列表

| 脚本 | 功能 |
|------|------|
| `start-all.sh` | 启动所有服务（Redis + Market Service） |
| `stop-all.sh` | 停止所有服务 |
| `start-redis.sh` | 单独启动 Redis |
| `start-market-service.sh` | 单独启动 Market Service |
| `health-check.sh` | 健康检查 |
| `monitor-redis.sh` | Redis 监控 |
| `backup-redis.sh` | Redis 数据备份 |
| `clean-logs.sh` | 清理日志文件 |

## 🚀 快速开始

### 1. 启动所有服务
```bash
cd /workspace/projects/market-service/scripts
bash start-all.sh
```

### 2. 健康检查
```bash
bash health-check.sh
```

### 3. 监控 Redis
```bash
bash monitor-redis.sh
```

## 📋 详细使用说明

### 启动服务

#### 启动所有服务
```bash
bash start-all.sh
```
- 自动启动 Redis
- 自动启动 Market Service
- 显示服务状态

#### 单独启动 Redis
```bash
bash start-redis.sh
```

#### 单独启动 Market Service
```bash
bash start-market-service.sh
```

### 停止服务
```bash
bash stop-all.sh
```

### 健康检查
```bash
bash health-check.sh
```

输出示例：
```
🏥 Health Check
================================

📦 Services:
   Redis:          ✅ Running
   Market Service: ✅ Running

🌐 Ports:
   Redis (6379):           ✅ Listening
   Market HTTP (3000):     ✅ Listening
   Market WebSocket (8081): ✅ Listening

✅ All services are healthy!
```

### 监控 Redis
```bash
bash monitor-redis.sh
```

输出示例：
```
📊 Redis Monitor
================================

📈 Status:
PONG
   Uptime: 2354 seconds

💾 Memory:
   Used: 1.23M
   Peak: 1.25M
   Fragmentation: 2.50

🔌 Connections:
   Connected: 2

🗄️ Database:
   Total Keys: 31

⚡ Cache Stats:
   Hits: 7
   Misses: 16
   Hit Rate: 30.43%

🕯️ K-line Cache Keys:
   Total: 31

⏱️ Slow Queries:
   No slow queries
```

### 备份数据
```bash
bash backup-redis.sh
```

备份位置：`/tmp/redis-backup/`

### 清理日志
```bash
bash clean-logs.sh
```

## ⏰ 定时任务建议

### 每日健康检查
```bash
crontab -e

# 每 5 分钟检查一次服务状态
*/5 * * * * /workspace/projects/market-service/scripts/health-check.sh >> /tmp/health-check.log 2>&1

# 每小时备份一次 Redis
0 * * * * /workspace/projects/market-service/scripts/backup-redis.sh >> /tmp/redis-backup.log 2>&1

# 每天凌晨 3 点清理日志
0 3 * * * /workspace/projects/market-service/scripts/clean-logs.sh >> /tmp/clean-logs.log 2>&1
```

### 开机自启动
```bash
crontab -e

# @reboot 会在系统重启后自动执行
@reboot /workspace/projects/market-service/scripts/start-all.sh >> /tmp/startup.log 2>&1
```

## 🔍 故障排查

### Redis 无法启动
```bash
# 查看日志
tail -f /tmp/redis.log

# 检查端口占用
ss -tuln | grep 6379

# 手动启动
redis-server /etc/redis/redis.conf --daemonize yes
```

### Market Service 无法启动
```bash
# 查看日志
tail -f /tmp/market-service.log

# 检查 Redis 连接
redis-cli ping

# 手动启动
cd /workspace/projects/market-service
nohup npx tsx src/index.ts > /tmp/market-service.log 2>&1 &
```

### Redis 内存不足
```bash
# 查看内存使用
bash monitor-redis.sh

# 清理过期缓存
redis-cli --scan --pattern "kline:*" | head -100 | xargs redis-cli del

# 增加内存限制
redis-cli config set maxmemory 1gb
```

## 📊 性能指标参考

| 指标 | 正常范围 | 警告值 |
|------|---------|--------|
| 内存使用 | < 400MB | > 450MB |
| 内存碎片率 | 1.0 - 1.5 | > 2.0 |
| 连接数 | 1 - 10 | > 20 |
| 缓存命中率 | > 80% | < 50% |
| 慢查询 | 0 | > 5 |

## 🛠️ 常用命令

### Redis 命令
```bash
# 连接 Redis
redis-cli

# 查看所有键
redis-cli keys "*"

# 查看特定键
redis-cli get kline:XAUUSD:5

# 清空所有缓存（慎用）
redis-cli flushdb

# 关闭 Redis
redis-cli shutdown
```

### Market Service 命令
```bash
# 查看进程
ps aux | grep "tsx src/index.ts"

# 查看日志
tail -f /tmp/market-service.log

# 杀死进程
pkill -f "tsx src/index.ts"
```

## 📝 日志位置

| 日志文件 | 位置 |
|---------|------|
| Redis 日志 | `/tmp/redis.log` |
| Market Service 日志 | `/tmp/market-service.log` |
| 健康检查日志 | `/tmp/health-check.log` |
| Redis 备份日志 | `/tmp/redis-backup.log` |

## 🔒 安全建议

1. **设置 Redis 密码**（生产环境）
```bash
vim /etc/redis/redis.conf
# 添加：requirepass your_password
```

2. **限制访问 IP**
```bash
vim /etc/redis/redis.conf
# 修改：bind 127.0.0.1
```

3. **定期备份**
- 建议每天备份一次
- 保留最近 7 天的备份

4. **监控告警**
- 设置定时任务监控
- 异常时发送通知

## 📞 技术支持

如有问题，请检查：
1. Redis 日志：`tail -f /tmp/redis.log`
2. Market Service 日志：`tail -f /tmp/market-service.log`
3. 健康检查：`bash health-check.sh`
