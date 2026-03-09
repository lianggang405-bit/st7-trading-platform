import { getSupabase } from './src/config/database';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 修复 K 线数据断层
 * 为缺失的时间点生成平盘 K 线
 */
async function repairKlines(
  symbol?: string,
  interval: string = '1m',
  intervalMs: number = 60_000,
  dryRun: boolean = false
) {
  console.log('🔧 K线修复脚本启动\n');
  console.log(`配置:`);
  console.log(`  - 交易对: ${symbol || '所有'}`);
  console.log(`  - 时间周期: ${interval}`);
  console.log(`  - 时间间隔: ${intervalMs}ms`);
  console.log(`  - 模式: ${dryRun ? '仅预览（不写入）' : '写入数据库'}`);
  console.log('');

  const supabase = getSupabase();

  // 构建查询
  let query = supabase
    .from('klines')
    .select('*')
    .eq('interval', interval)
    .order('open_time', { ascending: true });

  if (symbol) {
    query = query.eq('symbol', symbol.toUpperCase());
  }

  console.log('📊 查询数据库...');
  const { data: candles, error } = await query;

  if (error) {
    console.error('❌ 查询失败:', error);
    process.exit(1);
  }

  if (!candles || candles.length === 0) {
    console.log('ℹ️ 没有找到 K 线数据');
    process.exit(0);
  }

  console.log(`✅ 找到 ${candles.length} 根 K 线\n`);

  // 按交易对分组
  const candlesBySymbol: Record<string, any[]> = {};
  candles.forEach((candle) => {
    if (!candlesBySymbol[candle.symbol]) {
      candlesBySymbol[candle.symbol] = [];
    }
    candlesBySymbol[candle.symbol].push(candle);
  });

  const allFixedCandles: any[] = [];
  const symbols = Object.keys(candlesBySymbol);

  console.log(`🔍 检查 ${symbols.length} 个交易对的断层...`);

  for (let i = 0; i < symbols.length; i++) {
    const currentSymbol = symbols[i];
    const symbolCandles = candlesBySymbol[currentSymbol];

    console.log(`\n📈 [${i + 1}/${symbols.length}] 检查 ${currentSymbol} (${symbolCandles.length} 根 K线)`);

    let fixedCount = 0;

    for (let j = 1; j < symbolCandles.length; j++) {
      const prev = symbolCandles[j - 1];
      const cur = symbolCandles[j];

      // 转换 open_time 为毫秒时间戳
      const prevOpenTime = new Date(prev.open_time).getTime();
      const curOpenTime = new Date(cur.open_time).getTime();

      // 计算时间差
      const diff = curOpenTime - prevOpenTime;

      // 如果时间差大于 intervalMs，说明有断层
      if (diff > intervalMs) {
        const missingCount = Math.floor(diff / intervalMs);
        console.log(
          `  ⚠️ 发现断层: ${new Date(prevOpenTime).toLocaleTimeString()} → ` +
          `${new Date(curOpenTime).toLocaleTimeString()} ` +
          `(缺失 ${missingCount} 根 K线)`
        );

        // 生成缺失的平盘 K 线
        let t = prevOpenTime + intervalMs;
        while (t < curOpenTime) {
          const flatCandle = {
            symbol: currentSymbol,
            interval,
            open: prev.close,
            high: prev.close,
            low: prev.close,
            close: prev.close,
            volume: 0,
            open_time: new Date(t).toISOString(),
            close_time: new Date(t + intervalMs).toISOString(),
          };

          allFixedCandles.push(flatCandle);
          fixedCount++;
          t += intervalMs;
        }
      }
    }

    if (fixedCount === 0) {
      console.log(`  ✅ ${currentSymbol} 无断层`);
    } else {
      console.log(`  ✅ ${currentSymbol} 修复了 ${fixedCount} 根 K线`);
    }
  }

  console.log(`\n📊 总结:`);
  console.log(`  - 检查的交易对数: ${symbols.length}`);
  console.log(`  - 总 K 线数: ${candles.length}`);
  console.log(`  - 修复的 K 线数: ${allFixedCandles.length}`);

  if (allFixedCandles.length === 0) {
    console.log(`\n✅ 所有 K 线数据完整，无需修复`);
    process.exit(0);
  }

  if (dryRun) {
    console.log(`\n📋 预览（前 10 根）:`);
    allFixedCandles.slice(0, 10).forEach((candle, index) => {
      console.log(
        `  ${index + 1}. ${candle.symbol} ${candle.interval} ` +
        `@ ${new Date(new Date(candle.open_time).getTime()).toLocaleTimeString()} ` +
        `(O=${candle.open.toFixed(2)})`
      );
    });

    console.log(`\nℹ️ 这是预览模式，没有实际写入数据库`);
    console.log(`ℹ️ 使用 --write 参数实际写入数据库`);
    process.exit(0);
  }

  // 写入数据库
  console.log(`\n💾 写入数据库...`);

  // 分批写入（每次 100 条）
  const batchSize = 100;
  let totalWritten = 0;

  for (let i = 0; i < allFixedCandles.length; i += batchSize) {
    const batch = allFixedCandles.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('klines')
      .upsert(batch, {
        onConflict: 'symbol,interval,open_time',
        ignoreDuplicates: false
      });

    if (insertError) {
      console.error(`❌ 写入失败 (批次 ${i / batchSize + 1}):`, insertError);
      process.exit(1);
    }

    totalWritten += batch.length;
    console.log(`  ✅ 批次 ${Math.floor(i / batchSize) + 1}: 写入 ${batch.length} 根`);
  }

  console.log(`\n✅ 成功写入 ${totalWritten} 根 K线`);
  console.log(`\n🎉 修复完成！`);
}

/**
 * 获取时间周期的毫秒数
 */
function getIntervalMs(interval: string): number {
  const intervals: Record<string, number> = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };

  return intervals[interval] || 60 * 1000; // 默认 1 分钟
}

// 解析命令行参数
const args = process.argv.slice(2);
const symbolArg = args.find(arg => arg.startsWith('--symbol='))?.split('=')[1];
const intervalArg = args.find(arg => arg.startsWith('--interval='))?.split('=')[1];
const dryRunArg = args.includes('--dry-run');
const writeArg = args.includes('--write');

const dryRun = dryRunArg || !writeArg; // 默认是预览模式
const symbol = symbolArg;
const interval = intervalArg || '1m';
const intervalMs = getIntervalMs(interval);

// 运行修复脚本
repairKlines(symbol, interval, intervalMs, dryRun)
  .then(() => {
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 修复失败:', error);
    process.exit(1);
  });
