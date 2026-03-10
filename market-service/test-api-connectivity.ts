/**
 * 行情数据API连通性测试脚本
 *
 * 测试目标：
 * 1. 测试所有数据源的连通性
 * 2. 测试响应时间
 * 3. 测试数据完整性
 * 4. 测试多次请求的稳定性
 * 5. 生成测试报告
 */

// 导入数据源函数
import { getGoldApiPrice, getAllGoldApiPrices } from './src/collectors/gold-api';
import { getExchangeRates } from './src/collectors/exchange-rate-api';
import { getOilPriceFromInvesting, getAllOilPrices } from './src/collectors/oil-price-api';

// 测试配置
const TEST_CONFIG = {
  // 测试次数
  iterations: 5,
  // 超时时间（秒）
  timeout: 15,
  // 测试间隔（秒）
  interval: 3
};

// 测试结果
interface TestResult {
  source: string;
  symbol: string;
  success: boolean;
  responseTime: number;
  price: number | null;
  error?: string;
}

interface SourceReport {
  source: string;
  totalTests: number;
  successCount: number;
  failureCount: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
  results: TestResult[];
}

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function logSuccess(message: string) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message: string) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarn(message: string) {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function logInfo(message: string) {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function logSection(message: string) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}`);
  console.log(`  ${message}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

/**
 * 测试单个API
 */
async function testApi(
  source: string,
  symbol: string,
  fetchFn: () => Promise<number | null>
): Promise<TestResult> {
  const startTime = Date.now();

  try {
    // 设置超时
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), TEST_CONFIG.timeout * 1000);
    });

    const price = await Promise.race([fetchFn(), timeoutPromise]);

    const responseTime = Date.now() - startTime;

    if (price !== null && !isNaN(price)) {
      return {
        source,
        symbol,
        success: true,
        responseTime,
        price,
      };
    } else {
      return {
        source,
        symbol,
        success: false,
        responseTime,
        price: null,
        error: 'Invalid price data',
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      source,
      symbol,
      success: false,
      responseTime,
      price: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 测试 Gold API
 */
async function testGoldApi(): Promise<SourceReport> {
  logSection('📊 Testing Gold API');

  const symbols = ['XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD'];
  const results: TestResult[] = [];

  for (const symbol of symbols) {
    const result = await testApi('Gold API', symbol, () => getGoldApiPrice(symbol));
    results.push(result);

    if (result.success) {
      logSuccess(`${symbol}: $${result.price?.toFixed(2)} (${result.responseTime}ms)`);
    } else {
      logError(`${symbol}: ${result.error} (${result.responseTime}ms)`);
    }

    await new Promise(resolve => setTimeout(resolve, 500)); // 避免请求过快
  }

  return generateReport('Gold API', results);
}

/**
 * 测试 Exchange Rate API
 */
async function testExchangeRateApi(): Promise<SourceReport> {
  logSection('📊 Testing Exchange Rate API');

  const results: TestResult[] = [];

  try {
    const rates = await getExchangeRates();

    if (rates.size === 0) {
      logError('No exchange rates fetched');
      return generateReport('Exchange Rate API', []);
    }

    // 测试前10个交易对
    const testSymbols = Array.from(rates.keys()).slice(0, 10);

    for (const symbol of testSymbols) {
      const startTime = Date.now();
      const price = rates.get(symbol);
      const responseTime = Date.now() - startTime;

      if (price !== null && !isNaN(price)) {
        results.push({
          source: 'Exchange Rate API',
          symbol,
          success: true,
          responseTime,
          price,
        });
        logSuccess(`${symbol}: ${price.toFixed(4)} (${responseTime}ms)`);
      } else {
        results.push({
          source: 'Exchange Rate API',
          symbol,
          success: false,
          responseTime,
          price: null,
          error: 'Invalid rate',
        });
        logError(`${symbol}: Invalid rate (${responseTime}ms)`);
      }
    }
  } catch (error) {
    logError(`Exchange Rate API error: ${error}`);
  }

  return generateReport('Exchange Rate API', results);
}

/**
 * 测试 Oil Price API
 */
async function testOilPriceApi(): Promise<SourceReport> {
  logSection('📊 Testing Oil Price API');

  const symbols = ['USOIL', 'UKOIL', 'NGAS'];
  const results: TestResult[] = [];

  for (const symbol of symbols) {
    const result = await testApi('Oil Price API', symbol, () => getOilPriceFromInvesting(symbol));
    results.push(result);

    if (result.success) {
      logSuccess(`${symbol}: $${result.price?.toFixed(2)} (${result.responseTime}ms)`);
    } else {
      logError(`${symbol}: ${result.error} (${result.responseTime}ms)`);
    }

    await new Promise(resolve => setTimeout(resolve, 500)); // 避免请求过快
  }

  return generateReport('Oil Price API', results);
}

/**
 * 测试 Binance WebSocket
 */
async function testBinanceWebSocket(): Promise<SourceReport> {
  logSection('📊 Testing Binance WebSocket');

  const results: TestResult[] = [];

  try {
    // 导入 WebSocket 收集器
    const { BinanceWebSocketCollector } = await import('./src/collectors/binance-websocket');

    const collector = new BinanceWebSocketCollector(['BTC', 'ETH']);

    // 设置价格更新回调
    const pricePromises: Promise<void>[] = [];

    collector.setPriceUpdateCallback((symbol, price) => {
      const startTime = Date.now();
      const responseTime = 0; // WebSocket 实时推送，延迟极小

      const result: TestResult = {
        source: 'Binance WebSocket',
        symbol: `${symbol}USD`,
        success: true,
        responseTime,
        price,
      };

      results.push(result);
      logSuccess(`${symbol}USD: $${price.toFixed(2)} (real-time)`);
    });

    logInfo('Starting Binance WebSocket...');
    await collector.start();

    // 等待接收数据
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 停止收集器
    await collector.stop();

    if (results.length === 0) {
      logError('No WebSocket data received');
    }

  } catch (error) {
    logError(`Binance WebSocket error: ${error}`);
    results.push({
      source: 'Binance WebSocket',
      symbol: 'BTCUSD',
      success: false,
      responseTime: 0,
      price: null,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return generateReport('Binance WebSocket', results);
}

/**
 * 生成测试报告
 */
function generateReport(source: string, results: TestResult[]): SourceReport {
  const totalTests = results.length;
  const successCount = results.filter(r => r.success).length;
  const failureCount = totalTests - successCount;

  const responseTimes = results.map(r => r.responseTime).filter(t => t > 0);
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0;
  const minResponseTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
  const maxResponseTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;

  const successRate = totalTests > 0 ? (successCount / totalTests) * 100 : 0;

  return {
    source,
    totalTests,
    successCount,
    failureCount,
    avgResponseTime,
    minResponseTime,
    maxResponseTime,
    successRate,
    results,
  };
}

/**
 * 打印报告
 */
function printReport(report: SourceReport) {
  console.log(`\n${colors.cyan}📈 ${report.source} Report:${colors.reset}`);
  console.log(`  Total Tests: ${report.totalTests}`);
  console.log(`  ${colors.green}Success: ${report.successCount}${colors.reset}`);
  console.log(`  ${colors.red}Failure: ${report.failureCount}${colors.reset}`);
  console.log(`  Success Rate: ${report.successRate.toFixed(1)}%`);
  console.log(`  Avg Response Time: ${report.avgResponseTime.toFixed(0)}ms`);
  console.log(`  Min Response Time: ${report.minResponseTime}ms`);
  console.log(`  Max Response Time: ${report.maxResponseTime}ms`);

  if (report.failureCount > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    report.results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`  - ${r.symbol}: ${r.error}`);
      });
  }
}

/**
 * 稳定性测试（多次请求）
 */
async function stabilityTest(
  source: string,
  symbol: string,
  fetchFn: () => Promise<number | null>,
  iterations: number = TEST_CONFIG.iterations
): Promise<SourceReport> {
  logSection(`🔄 Stability Test: ${source} - ${symbol}`);

  const results: TestResult[] = [];

  for (let i = 0; i < iterations; i++) {
    const result = await testApi(source, symbol, fetchFn);
    results.push(result);

    if (result.success) {
      logSuccess(`Test ${i + 1}/${iterations}: $${result.price?.toFixed(2)} (${result.responseTime}ms)`);
    } else {
      logError(`Test ${i + 1}/${iterations}: ${result.error} (${result.responseTime}ms)`);
    }

    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.interval * 1000));
  }

  return generateReport(`${source} (Stability)`, results);
}

/**
 * 主函数
 */
async function main() {
  console.log(`\n${colors.cyan}╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  Market Data API Connectivity & Stability Test        ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝${colors.reset}`);

  console.log(`\n${colors.blue}Test Configuration:${colors.reset}`);
  console.log(`  Iterations: ${TEST_CONFIG.iterations}`);
  console.log(`  Timeout: ${TEST_CONFIG.timeout}s`);
  console.log(`  Interval: ${TEST_CONFIG.interval}s`);

  const reports: SourceReport[] = [];

  // 1. 测试 Gold API
  try {
    const report = await testGoldApi();
    reports.push(report);
    printReport(report);
  } catch (error) {
    logError(`Gold API test failed: ${error}`);
  }

  // 2. 测试 Exchange Rate API
  try {
    const report = await testExchangeRateApi();
    reports.push(report);
    printReport(report);
  } catch (error) {
    logError(`Exchange Rate API test failed: ${error}`);
  }

  // 3. 测试 Oil Price API
  try {
    const report = await testOilPriceApi();
    reports.push(report);
    printReport(report);
  } catch (error) {
    logError(`Oil Price API test failed: ${error}`);
  }

  // 4. 测试 Binance WebSocket
  try {
    const report = await testBinanceWebSocket();
    reports.push(report);
    printReport(report);
  } catch (error) {
    logError(`Binance WebSocket test failed: ${error}`);
  }

  // 5. 稳定性测试（选择关键交易对）
  logSection(`🔄 Running Stability Tests`);

  try {
    const stabilityReport1 = await stabilityTest('Gold API', 'XAUUSD', () => getGoldApiPrice('XAUUSD'));
    reports.push(stabilityReport1);
    printReport(stabilityReport1);
  } catch (error) {
    logError(`Gold API stability test failed: ${error}`);
  }

  try {
    const stabilityReport2 = await stabilityTest('Oil Price API', 'USOIL', () => getOilPriceFromInvesting('USOIL'));
    reports.push(stabilityReport2);
    printReport(stabilityReport2);
  } catch (error) {
    logError(`Oil Price API stability test failed: ${error}`);
  }

  // 6. 总体报告
  logSection('📊 Overall Summary');

  const totalTests = reports.reduce((sum, r) => sum + r.totalTests, 0);
  const totalSuccess = reports.reduce((sum, r) => sum + r.successCount, 0);
  const totalFailure = reports.reduce((sum, r) => sum + r.failureCount, 0);
  const overallSuccessRate = totalTests > 0 ? (totalSuccess / totalTests) * 100 : 0;

  console.log(`${colors.cyan}Overall Statistics:${colors.reset}`);
  console.log(`  Total Tests: ${totalTests}`);
  console.log(`  ${colors.green}Total Success: ${totalSuccess}${colors.reset}`);
  console.log(`  ${colors.red}Total Failure: ${totalFailure}${colors.reset}`);
  console.log(`  Overall Success Rate: ${overallSuccessRate.toFixed(1)}%`);

  // 数据源评级
  console.log(`\n${colors.cyan}Data Source Ratings:${colors.reset}`);
  reports.forEach(report => {
    let rating = '';
    if (report.successRate >= 90) {
      rating = `${colors.green}🟢 Excellent${colors.reset}`;
    } else if (report.successRate >= 70) {
      rating = `${colors.yellow}🟡 Good${colors.reset}`;
    } else if (report.successRate >= 50) {
      rating = `${colors.red}🟠 Fair${colors.reset}`;
    } else {
      rating = `${colors.red}🔴 Poor${colors.reset}`;
    }

    console.log(`  ${report.source}: ${report.successRate.toFixed(1)}% ${rating}`);
  });

  // 建议
  console.log(`\n${colors.cyan}Recommendations:${colors.reset}`);

  const failedSources = reports.filter(r => r.successRate < 70);
  if (failedSources.length > 0) {
    console.log(`  ${colors.yellow}⚠️  Consider improving or replacing these sources:${colors.reset}`);
    failedSources.forEach(source => {
      console.log(`    - ${source.source} (${source.successRate.toFixed(1)}%)`);
    });
  } else {
    logSuccess('All data sources are performing well!');
  }

  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}Test completed!${colors.reset}\n`);
}

// 运行测试
main().catch(console.error);
