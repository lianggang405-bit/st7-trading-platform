
module.exports = {
  apps: [
    {
      name: "st7-trading-platform",
      script: "npm",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
        // 这里可以添加其他环境变量，例如 Supabase 配置
        // COZE_SUPABASE_URL: "...",
        // COZE_SUPABASE_ANON_KEY: "...",
        // JWT_SECRET: "...",
      },
    },
  ],
};
