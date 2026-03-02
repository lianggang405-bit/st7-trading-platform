
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
        // 杩欓噷鍙互娣诲姞鍏朵粬鐜鍙橀噺锛屼緥濡?Supabase 閰嶇疆
        // NEXT_PUBLIC_SUPABASE_URL: "...",
        // NEXT_PUBLIC_SUPABASE_ANON_KEY: "...",
        // JWT_SECRET: "...",
      },
    },
  ],
};

