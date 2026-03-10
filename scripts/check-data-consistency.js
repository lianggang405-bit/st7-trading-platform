/**
 * 数据一致性检查脚本
 * 
 * 功能：
 * 1. 检查数据库中最新价格是否在合理范围内
 * 2. 检测价格异常（偏离基准价格超过 20%）
 * 3. 生成一致性报告
 * 
 * 使用方法：
 * node scripts/check-data-consistency.js
 */

const https = require('https');

// Supabase 配置
const SUPABASE_URL = 'https://brfzboxaxknlypapwajy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3FOyR_TdA-_zwg4K-8Feqg_Lka84e0o';

// 2026年3月真实市场价格（基准价格）
const BASE_PRICES = {
  XAUUSD: 5100.00,
  XAGUSD: 33.50,
  BTCUSD: 66500.00,
  ETHUSD: 3450.00,
  LTCUSD: 85.00,
  SOLUSD: 148.00,
  XRPUSD: 0.52,
  DOGEUSD: 0.12,
  EURUSD: 1.0850,
  GBPUSD: 1.2730,
  USDJPY: 154.50,
  USDCHF: 0.8920,
  EURAUD: 1.6650,
  EURGBP: 0.8520,
  EURJPY: 167.60,
  GBPAUD: 1.9340,
  GBPNZD: 2.1150,
  GBPJPY: 196.80,
  AUDUSD: 0.6550,
  AUDJPY: 101.20,
  NZDUSD: 0.6050,
  NZDJPY: 93.40,
  CADJPY: 112.50,
  CHFJPY: 173.20,
  NGAS: 2.89,
  UKOIL: 75.00,
  USOIL: 71.89,
  US500: 5204.26,
  ND25: 18826.76,
  AUS200: 8036.90,
};

// 价格偏差阈值
const DEVIATION_THRESHOLD = 0.20; // 20%

// HTTP 请求辅助函数
function httpsRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

// 获取最新价格
async function getLatestPrices() {
  const url = `${SUPABASE_URL}/rest/v1/klines?select=symbol,close,open_time&order=open_time.desc`;
  const options = {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
    },
  };

  try {
    const response = await httpsRequest(url, options);
    const data = JSON.parse(response);
    
    // 按交易对分组，取每个交易对的最新价格
    const latestPrices = {};
    const seenSymbols = new Set();
    
    for (const item of data) {
      if (!seenSymbols.has(item.symbol)) {
        latestPrices[item.symbol] = item.close;
        seenSymbols.add(item.symbol);
      }
    }
    
    return latestPrices;
  } catch (error) {
    console.error('❌ Error fetching latest prices:', error.message);
    return {};
  }
}

// 检查数据一致性
async function checkConsistency() {
  console.log('🔍 Starting data consistency check...');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}\n`);
  
  const latestPrices = await getLatestPrices();
  const symbols = Object.keys(BASE_PRICES);
  
  let okCount = 0;
  let warningCount = 0;
  let errorCount = 0;
  let missingCount = 0;
  
  const issues = [];
  
  console.log('📊 Price Consistency Report:');
  console.log('─'.repeat(100));
  console.log('Symbol'.padEnd(10) + 'Latest'.padEnd(15) + 'Base'.padEnd(15) + 'Deviation'.padEnd(15) + 'Status');
  console.log('─'.repeat(100));
  
  for (const symbol of symbols) {
    const latestPrice = latestPrices[symbol];
    const basePrice = BASE_PRICES[symbol];
    
    if (!latestPrice) {
      missingCount++;
      console.log(
        symbol.padEnd(10) + 
        'N/A'.padEnd(15) + 
        basePrice.toFixed(2).padEnd(15) + 
        'N/A'.padEnd(15) + 
        '❌ MISSING'
      );
      issues.push({
        symbol,
        type: 'MISSING',
        message: 'No price data found in database',
      });
      continue;
    }
    
    const deviation = (latestPrice - basePrice) / basePrice;
    const deviationPercent = (deviation * 100).toFixed(2);
    
    if (Math.abs(deviation) > DEVIATION_THRESHOLD) {
      errorCount++;
      console.log(
        symbol.padEnd(10) + 
        latestPrice.toFixed(2).padEnd(15) + 
        basePrice.toFixed(2).padEnd(15) + 
        `${deviationPercent}%`.padEnd(15) + 
        '❌ CRITICAL'
      );
      issues.push({
        symbol,
        type: 'CRITICAL',
        message: `Price deviates by ${deviationPercent}% from base price`,
        latestPrice,
        basePrice,
        deviation,
      });
    } else if (Math.abs(deviation) > DEVIATION_THRESHOLD / 2) {
      warningCount++;
      console.log(
        symbol.padEnd(10) + 
        latestPrice.toFixed(2).padEnd(15) + 
        basePrice.toFixed(2).padEnd(15) + 
        `${deviationPercent}%`.padEnd(15) + 
        '⚠️  WARNING'
      );
      issues.push({
        symbol,
        type: 'WARNING',
        message: `Price deviates by ${deviationPercent}% from base price`,
        latestPrice,
        basePrice,
        deviation,
      });
    } else {
      okCount++;
      console.log(
        symbol.padEnd(10) + 
        latestPrice.toFixed(2).padEnd(15) + 
        basePrice.toFixed(2).padEnd(15) + 
        `${deviationPercent}%`.padEnd(15) + 
        '✅ OK'
      );
    }
  }
  
  console.log('─'.repeat(100));
  console.log('\n📈 Summary:');
  console.log(`   ✅ OK: ${okCount}/${symbols.length}`);
  console.log(`   ⚠️  WARNING: ${warningCount}/${symbols.length}`);
  console.log(`   ❌ CRITICAL: ${errorCount}/${symbols.length}`);
  console.log(`   ❓ MISSING: ${missingCount}/${symbols.length}`);
  
  if (issues.length > 0) {
    console.log('\n⚠️  Issues Found:');
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. [${issue.type}] ${issue.symbol}: ${issue.message}`);
    });
  }
  
  console.log(`\n⏰ Check completed at: ${new Date().toISOString()}`);
  
  return {
    okCount,
    warningCount,
    errorCount,
    missingCount,
    issues,
  };
}

// 执行检查
checkConsistency().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

module.exports = { checkConsistency, BASE_PRICES };
