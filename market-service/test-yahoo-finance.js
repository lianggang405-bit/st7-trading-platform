/**
 * 测试 Yahoo Finance API
 * 用于诊断价格获取问题
 */

async function testYahooFinance() {
  console.log('🔍 Testing Yahoo Finance API...\n');

  const symbols = {
    'GC=F': '黄金 (XAUUSD)',
    'SI=F': '白银 (XAGUSD)',
  };

  for (const [yahooSymbol, name] of Object.entries(symbols)) {
    console.log(`📡 Testing ${name} (${yahooSymbol})...`);

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });

      console.log(`   HTTP Status: ${response.status}`);

      if (!response.ok) {
        console.log(`   ❌ Failed: HTTP ${response.status}`);
        continue;
      }

      const data = await response.json();
      console.log(`   Response keys: ${Object.keys(data).join(', ')}`);

      if (data.chart && data.chart.result && data.chart.result[0]) {
        const result = data.chart.result[0];
        const meta = result.meta;

        console.log(`   ✅ Got data!`);
        console.log(`   Currency: ${meta.currency}`);
        console.log(`   Symbol: ${meta.symbol}`);
        console.log(`   Exchange: ${meta.exchangeName}`);
        console.log(`   Instrument Type: ${meta.instrumentType}`);
        console.log(`   Market State: ${meta.marketState}`);

        // 检查价格字段
        const priceFields = [
          'regularMarketPrice',
          'previousClose',
          'chartPreviousClose',
          'preMarketPrice',
          'postMarketPrice',
        ];

        console.log(`   \n📊 Price fields:`);
        priceFields.forEach((field) => {
          const value = meta[field];
          if (value !== undefined && value !== null) {
            console.log(`   ${field}: $${value}`);
          }
        });

        // 打印完整的 meta 数据
        console.log(`   \n📋 Full meta data:`);
        console.log(JSON.stringify(meta, null, 2));
      } else {
        console.log(`   ❌ No data in response`);
        console.log(`   Full response:`, JSON.stringify(data, null, 2));
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('');
  }

  console.log('✅ Test completed');
}

// 运行测试
testYahooFinance().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
