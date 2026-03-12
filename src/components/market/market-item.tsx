import { Change, Price } from '../data';
import { useState, useEffect, useRef } from 'react';
import { formatSymbol } from '../../lib/formatSymbol';
import { CryptoIcon } from '../crypto-icon';

// 迷你K线图组件
interface MiniChartProps {
  trend: 'up' | 'down';
  isLoading?: boolean;
}

export function MiniChart({ trend, isLoading }: MiniChartProps) {
  // 图片样式：红色=跌，蓝色=涨
  const lineColor = trend === 'up' ? '#3b82f6' : '#ef4444'; // 蓝色=涨，红色=跌
  const fillColor = trend === 'up'
    ? 'rgba(59, 130, 246, 0.2)' // 浅蓝色半透明
    : 'rgba(239, 68, 68, 0.2)'; // 浅红色半透明

  if (isLoading) {
    return (
      <div className="flex h-12 w-20 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  // 生成模拟走势数据（更加平滑）
  const points = Array.from({ length: 20 }, (_, i) => {
    // 上涨趋势：平稳后向上抬升
    // 下跌趋势：平稳后小幅度下降
    const baseY = trend === 'up'
      ? 35 - (i < 10 ? 0 : (i - 10) * 0.8) + (Math.random() * 3 - 1.5) // 前半段平稳，后半段向上
      : 25 + (i < 10 ? 0 : (i - 10) * 0.3) + (Math.random() * 3 - 1.5); // 前半段平稳，后半段小幅下降
    const y = Math.max(15, Math.min(45, baseY));
    return `${i * 4},${y}`;
  }).join(' ');

  // 创建填充区域的路径（闭合到底部）
  const fillPath = `${points} 76,60 4,60`;

  return (
    <svg viewBox="0 0 80 60" className="h-12 w-20">
      {/* 渐变填充区域 */}
      <path
        d={`M${fillPath.replace(/,/g, ' ')} Z`}
        fill={fillColor}
        stroke="none"
      />

      {/* 主线条 */}
      <polyline
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// 获取品种图标（使用 emoji 或特殊符号）
export function getSymbolFlags(symbol: string): string[] {
  const flagMap: Record<string, string[]> = {
    // 外汇
    'EURUSD': ['🇪🇺', '🇺🇸'],
    'GBPUSD': ['🇬🇧', '🇺🇸'],
    'USDJPY': ['🇺🇸', '🇯🇵'],
    'USDCHF': ['🇺🇸', '🇨🇭'],
    'USDCAD': ['🇺🇸', '🇨🇦'],
    'EURAUD': ['🇪🇺', '🇦🇺'],
    'EURGBP': ['🇪🇺', '🇬🇧'],
    'EURJPY': ['🇪🇺', '🇯🇵'],
    'EURCHF': ['🇪🇺', '🇨🇭'],
    'GBPAUD': ['🇬🇧', '🇦🇺'],
    'GBPNZD': ['🇬🇧', '🇳🇿'],
    'GBPJPY': ['🇬🇧', '🇯🇵'],
    'GBPCHF': ['🇬🇧', '🇨🇭'],
    'AUDUSD': ['🇦🇺', '🇺🇸'],
    'AUDJPY': ['🇦🇺', '🇯🇵'],
    'AUDNZD': ['🇦🇺', '🇳🇿'],
    'AUDCHF': ['🇦🇺', '🇨🇭'],
    'AUDCAD': ['🇦🇺', '🇨🇦'],
    'NZDUSD': ['🇳🇿', '🇺🇸'],
    'NZDJPY': ['🇳🇿', '🇯🇵'],
    'NZDCHF': ['🇳🇿', '🇨🇭'],
    'NZDCAD': ['🇳🇿', '🇨🇦'],
    'CADJPY': ['🇨🇦', '🇯🇵'],
    'CADCHF': ['🇨🇦', '🇨🇭'],
    'CHFJPY': ['🇨🇭', '🇯🇵'],
    // 贵金属
    'XAUUSD': ['🥇'], // 黄金
    'XAGUSD': ['🥈'], // 白银
    // 加密货币
    'BTCUSD': ['₿'], // 比特币
    'ETHUSD': ['Ξ'], // 以太坊
    'LTCUSD': ['Ł'], // 莱特币
    'SOLUSD': ['◎'], // Solana
    'XRPUSD': ['✕'], // Ripple
    'DOGEUSD': ['🐕'], // Dogecoin
    'ADAUSD': ['₳'], // Cardano
    'DOTUSD': ['●'], // Polkadot
    'BNBUSD': ['◆'], // BNB
    'LINKUSD': ['🔗'], // Chainlink
    'AVAXUSD': ['🔺'], // Avalanche
    'MATICUSD': ['💜'], // Polygon
    'ATOMUSD': ['⚛'], // Cosmos
    'UNIUSD': ['🦄'], // Uniswap
    'XLMUSD': ['✴'], // Stellar
    'ALGOUSD': ['🅰️'], // Algorand
    'VETUSD': ['🔹'], // VeChain
    'NEARUSD': ['💎'], // NEAR Protocol
    'FILUSD': ['💾'], // Filecoin
    'SANDUSD': ['🏝️'], // The Sandbox
    'MANAUSD': ['🎮'], // Decentraland
    'AXSUSD': ['🎯'], // Axie Infinity
    // 能源
    'NGAS': ['🔥'], // 天然气
    'UKOIL': ['🛢️'], // 英国原油
    'USOIL': ['🛢️'], // 美国原油
    // 指数
    'US500': ['📊'], // 标普500
    'ND25': ['📈'], // 纳斯达克25
    'ND100': ['🚀'], // 纳斯达克100
    'AUS200': ['📉'], // 澳洲200
    'UK100': ['🏛️'], // 英国富时100
    'GER40': ['🇩🇪'], // 德国DAX
    'FRA40': ['🇫🇷'], // 法国CAC40
    'EU50': ['🇪🇺'], // 欧洲斯托克50
    'JPN225': ['🇯🇵'], // 日经225
    'CHN50': ['🇨🇳'], // 中国A50
    'HK50': ['🇭🇰'], // 恒生指数
  };

  // 如果有预定义的图标，直接返回
  if (flagMap[symbol]) {
    return flagMap[symbol];
  }

  // 根据交易对类型返回通用图标
  // 贵金属
  if (symbol.startsWith('XA') || symbol.startsWith('XG')) {
    return ['🥇'];
  }

  // 加密货币
  if (['BTC', 'ETH', 'LTC', 'SOL', 'XRP', 'DOGE', 'ADA', 'DOT', 'BNB', 'LINK', 'AVAX', 'MATIC', 'ATOM', 'UNI', 'XLM', 'ALGO', 'VET', 'NEAR', 'FIL', 'SAND', 'MANA', 'AXS', 'SHIB', 'AVAX', 'TRX', 'BCH'].some(c => symbol.includes(c))) {
    return ['₿'];
  }

  // 能源
  if (['NGAS', 'UKOIL', 'USOIL', 'WTI', 'BRENT'].some(e => symbol.includes(e))) {
    return ['🔥'];
  }

  // 指数
  if (['US', 'ND', 'AU', 'UK', 'GER', 'FRA', 'EU', 'JPN', 'CHN', 'HK', 'SG'].some(i => symbol.includes(i)) && /\d/.test(symbol)) {
    return ['📊'];
  }

  // 外汇（默认）
  return ['💱'];
}

// 单个行情项组件
interface MarketItemProps {
  symbol: string;
  price: number;
  change: number;
  onClick?: () => void;
}

export function MarketItem({ symbol, price, change, onClick }: MarketItemProps) {
  const flags = getSymbolFlags(symbol);
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'up';
  const [isLoading, setIsLoading] = useState(Math.random() < 0.1); // 10% 概率显示加载

  // 判断是否是加密货币
  const isCrypto = [
    'BTC', 'ETH', 'LTC', 'SOL', 'XRP', 'DOGE', 'ADA', 'DOT', 'BNB', 'LINK', 'AVAX', 'MATIC',
    'ATOM', 'UNI', 'XLM', 'ALGO', 'VET', 'NEAR', 'FIL', 'SAND', 'MANA', 'AXS', 'SHIB', 'TRX', 'BCH'
  ].some(c => symbol.includes(c));

  // 价格脉冲状态
  const [pulse, setPulse] = useState<'up' | 'down' | null>(null);

  // 使用 useRef 保存上一次的价格（不会因为重新渲染而重置）
  const prevPriceRef = useRef(price);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setIsLoading(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // 监听价格变化，触发脉冲动画
  useEffect(() => {
    const prevPrice = prevPriceRef.current;

    // 只有价格真正变化时才触发脉冲
    if (Math.abs(price - prevPrice) > 0.000001) {
      if (price > prevPrice) {
        setPulse('up');
      } else if (price < prevPrice) {
        setPulse('down');
      }

      const t = setTimeout(() => {
        setPulse(null);
      }, 350);

      return () => clearTimeout(t);
    }
  }, [price]);

  // 更新前一次价格的引用
  prevPriceRef.current = price;

  const getPricePrecision = (symbol: string) => {
    // JPY 对：3位小数
    if (symbol.includes('JPY')) return 3;

    // 贵金属和指数：2位小数
    if (['XAU', 'XAG', 'US500', 'ND25', 'AUS200'].some(s => symbol.includes(s))) return 2;

    // 加密货币：2位小数
    if (['BTC', 'ETH', 'LTC', 'SOL', 'XRP', 'DOGE'].some(s => symbol.includes(s))) return 2;

    // 其他外汇：5位小数
    return 5;
  };

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 border-b border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
    >
      {/* 左侧：品种代码 + 图标 */}
      <div className="flex min-w-[100px] items-center gap-2">
        {/* 加密货币使用彩色 SVG 图标，其他使用 emoji 图标 */}
        {isCrypto ? (
          <CryptoIcon symbol={symbol} size={24} />
        ) : flags.length > 0 ? (
          <div className="flex">
            {flags.map((flag, i) => (
              <span key={i} className="text-base">{flag}</span>
            ))}
          </div>
        ) : null}
        <span className="text-base font-bold text-gray-900">{formatSymbol(symbol)}</span>
      </div>

      {/* 中间：价格 + 涨跌幅（居中显示） */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-[100px]">
        <div className="flex items-center">
          <Price
            value={price}
            precision={getPricePrecision(symbol)}
            pulse={pulse}
            change={change}
          />
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Change value={change} showArrow />
        </div>
      </div>

      {/* 右侧：迷你K线图 */}
      <div className="w-20 flex-shrink-0">
        <MiniChart trend={trend} isLoading={isLoading} />
      </div>
    </div>
  );
}
