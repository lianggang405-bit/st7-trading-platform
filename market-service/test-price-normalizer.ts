/**
 * 测试 Price Normalizer
 */

import { PriceNormalizer, SymbolFormat } from './src/utils/price-normalizer';

console.log('=== Price Normalizer 测试 ===\n');

// 测试 1: Binance 格式转换
console.log('测试 1: Binance 格式 → Internal 格式');
const btcusdt = PriceNormalizer.toInternal('BTCUSDT', SymbolFormat.BINANCE);
console.log(`BTCUSDT → ${btcusdt}`);
console.log(`✅ 期望: BTCUSD\n`);

// 测试 2: TradingView 格式转换
console.log('测试 2: TradingView 格式 → Binance 格式');
const btcusd = PriceNormalizer.toBinance('BTCUSD', SymbolFormat.TRADINGVIEW);
console.log(`BTCUSD → ${btcusd}`);
console.log(`✅ 期望: BTCUSDT\n`);

// 测试 3: Gold API 格式转换
console.log('测试 3: Gold API 格式 → Internal 格式');
const xau = PriceNormalizer.toInternal('XAU', SymbolFormat.GOLD_API);
console.log(`XAU → ${xau}`);
console.log(`✅ 期望: XAUUSD\n`);

// 测试 4: 获取分类
console.log('测试 4: 获取交易对分类');
console.log(`BTCUSD → ${PriceNormalizer.getCategory('BTCUSD')}`);
console.log(`XAUUSD → ${PriceNormalizer.getCategory('XAUUSD')}`);
console.log(`EURUSD → ${PriceNormalizer.getCategory('EURUSD')}`);
console.log(`USOIL → ${PriceNormalizer.getCategory('USOIL')}`);
console.log(`✅ 期望: crypto, metal, forex, energy\n`);

// 测试 5: 获取所有交易对
console.log('测试 5: 获取所有交易对（Internal 格式）');
const allSymbols = PriceNormalizer.getAllSymbols(SymbolFormat.INTERNAL);
console.log(`总数: ${allSymbols.length}`);
console.log(`前 5 个: ${allSymbols.slice(0, 5).join(', ')}`);
console.log(`✅ 期望: 22 个交易对\n`);

// 测试 6: 按分类获取交易对
console.log('测试 6: 按分类获取交易对');
const cryptoSymbols = PriceNormalizer.getSymbolsByCategory('crypto', SymbolFormat.INTERNAL);
console.log(`加密货币 (${cryptoSymbols.length} 个): ${cryptoSymbols.slice(0, 3).join(', ')}...`);

const metalSymbols = PriceNormalizer.getSymbolsByCategory('metal', SymbolFormat.INTERNAL);
console.log(`贵金属 (${metalSymbols.length} 个): ${metalSymbols.join(', ')}`);

const forexSymbols = PriceNormalizer.getSymbolsByCategory('forex', SymbolFormat.INTERNAL);
console.log(`外汇 (${forexSymbols.length} 个): ${forexSymbols.slice(0, 3).join(', ')}...`);

const energySymbols = PriceNormalizer.getSymbolsByCategory('energy', SymbolFormat.INTERNAL);
console.log(`能源 (${energySymbols.length} 个): ${energySymbols.join(', ')}`);
console.log(`✅ 期望: 12 crypto, 4 metal, 7 forex, 3 energy\n`);

// 测试 7: 自动转换（不在映射表中）
console.log('测试 7: 自动转换');
const autoConverted = PriceNormalizer.toInternal('ETHUSDT', SymbolFormat.BINANCE);
console.log(`ETHUSDT → ${autoConverted}`);
console.log(`✅ 期望: ETHUSD\n`);

console.log('=== 所有测试完成 ✅ ===');
