import { testConnection } from './config/database';
import { MockDataGenerator } from './collectors/mock';

/**
 * 行情采集服务主入口
 */
async function main() {
  console.log('🚀 Starting Market Collector Service...\n');

  // 测试数据库连接
  console.log('1. Testing database connection...');
  const isConnected = await testConnection();

  if (!isConnected) {
    console.error('❌ Database connection failed. Please check your configuration.');
    process.exit(1);
  }

  console.log('');

  // 启动模拟数据生成器（默认使用模拟数据，因为网络限制）
  console.log('2. Starting mock data generator...');
  const mockGenerator = new MockDataGenerator(3000);
  mockGenerator.start();

  console.log('');
  console.log('✅ Market Collector Service is running!');
  console.log('📊 Collecting mock market data...');
  console.log('Press Ctrl+C to stop.\n');
}

// 运行主程序
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
