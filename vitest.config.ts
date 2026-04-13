import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
  },
  // 排除测试文件从 TypeScript 检查
  exclude: ['**/node_modules/**', '**/dist/**', '**/__tests__/**'],
});
