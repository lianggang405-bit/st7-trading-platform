'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, MouseEventParams, Time, CandlestickSeries } from 'lightweight-charts';
import { useTranslations } from 'next-intl';
import { useMarketStore } from '@/stores/marketStore';

interface TradingChartProps {
  symbol?: string;
  height?: number;
}

// 时间周期类型
type Timeframe = '1M' | '5M' | '15M' | '30M' | '1H' | '4H' | '1D';

// 时间周期配置（单位：秒）
const TIMEFRAMES: { value: Timeframe; label: string; interval: number }[] = [
  { value: '1M', label: '1M', interval: 60 },
  { value: '5M', label: '5M', interval: 300 },
  { value: '15M', label: '15M', interval: 900 },
  { value: '30M', label: '30M', interval: 1800 },
  { value: '1H', label: '1H', interval: 3600 },
  { value: '4H', label: '4H', interval: 14400 },
  { value: '1D', label: '1D', interval: 86400 },
];

interface KlineData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export default function TradingChart({ symbol = 'BTCUSD', height = 500 }: TradingChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslations('chart');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1M');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const lastPriceRef = useRef<number>(0);
  const klineDataRef = useRef<KlineData[]>([]);
  const { symbols } = useMarketStore();

  // ✅ 获取当前交易对的实时价格
  const currentSymbolData = symbols.find(s => s.symbol === symbol);
  const currentSymbolPrice = currentSymbolData?.price || 0;

  function getBasePrice(symbol: string): number {
    const basePrices: { [key: string]: number } = {
      'EURUSD': 1.0856,
      'GBPUSD': 1.2654,
      'USDJPY': 149.82,
      'XAUUSD': 2850,
      'XAGUSD': 32.5,
      'BTCUSD': 98500,
      'ETHUSD': 3250,
      'LTCUSD': 95,
      'SOLUSD': 145,
      'XRPUSD': 2.15,
      'DOGEUSD': 0.18,
      'NGAS': 3.15,
      'UKOIL': 82.5,
      'USOIL': 80.25,
      'US500': 5250,
      'ND25': 18500,
      'AUS200': 8125,
    };
    return basePrices[symbol] || 100;
  }

  // ✅ 监听当前交易对价格变化，同步更新 K 线
  useEffect(() => {
    if (currentSymbolPrice > 0 && lastPriceRef.current === 0) {
      // 第一次加载时，设置初始价格
      lastPriceRef.current = currentSymbolPrice;
      setCurrentPrice(currentSymbolPrice);
    }
  }, [currentSymbolPrice]);

  useEffect(() => {
    if (!chartRef.current) return;
    const timeframeConfig = TIMEFRAMES.find(tf => tf.value === selectedTimeframe) || TIMEFRAMES[0];
    const interval = timeframeConfig.interval;

    const chart = createChart(chartRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#DDD',
      },
      grid: {
        vertLines: { color: '#1f1f1f' },
        horzLines: { color: '#1f1f1f' },
      },
      width: chartRef.current.clientWidth,
      height: height,
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#758696',
          width: 1,
          style: 2,
          labelBackgroundColor: '#758696',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 2,
          labelBackgroundColor: '#758696',
        },
      },
      rightPriceScale: {
        borderColor: '#333',
      },
      timeScale: {
        borderColor: '#333',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartInstanceRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // 生成初始 K 线数据
    const klineData: KlineData[] = [];
    let basePrice = getBasePrice(symbol);

    for (let i = 200; i >= 0; i--) {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const timeSec = currentTimestamp - i * interval;
      const open = basePrice + (Math.random() - 0.5) * 100;
      const close = open + (Math.random() - 0.5) * 50;
      const high = Math.max(open, close) + Math.random() * 20;
      const low = Math.min(open, close) - Math.random() * 20;

      klineData.push({
        time: timeSec as Time,
        open: Math.round(open),
        high: Math.round(high),
        low: Math.round(low),
        close: Math.round(close),
      });

      basePrice = close;
    }

    candlestickSeries.setData(klineData);
    chart.timeScale().fitContent();
    chart.timeScale().scrollToPosition(5, false);

    klineDataRef.current = klineData;
    lastPriceRef.current = basePrice;
    setCurrentPrice(basePrice);

    // 十字线悬浮提示
    const handleCrosshairMove = (param: MouseEventParams) => {
      if (!param.point || !param.time || !tooltipRef.current) {
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
        return;
      }

      const data = param.seriesData.get(candlestickSeries) as KlineData;
      if (!data) return;

      tooltipRef.current.style.display = 'block';
      tooltipRef.current.style.left = param.point.x + 10 + 'px';
      tooltipRef.current.style.top = param.point.y + 'px';

      // @ts-ignore
      const timeValue = typeof data.time === 'number' ? data.time * 1000 : data.time;
      // @ts-ignore
      const formattedTime = new Date(timeValue).toLocaleString();
      tooltipRef.current.innerHTML = `
        <div style="color: #999; font-size: 12px; margin-bottom: 4px;">${formattedTime}</div>
        <div style="color: #666; font-size: 12px;">${t('open')}: ${data.open}</div>
        <div style="color: #666; font-size: 12px;">${t('high')}: ${data.high}</div>
        <div style="color: #666; font-size: 12px;">${t('low')}: ${data.low}</div>
        <div style="color: ${data.close >= data.open ? '#26a69a' : '#ef5350'}; font-size: 12px; font-weight: bold;">${t('close')}: ${data.close}</div>
      `;
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    // 创建 tooltip
    const tooltipDiv = document.createElement('div');
    tooltipDiv.style.position = 'absolute';
    tooltipDiv.style.zIndex = '1000';
    tooltipDiv.style.background = 'rgba(0, 0, 0, 0.8)';
    tooltipDiv.style.border = '1px solid #333';
    tooltipDiv.style.borderRadius = '4px';
    tooltipDiv.style.padding = '8px';
    tooltipDiv.style.color = '#fff';
    tooltipDiv.style.fontSize = '12px';
    tooltipDiv.style.pointerEvents = 'none';
    tooltipDiv.style.display = 'none';
    tooltipRef.current = tooltipDiv;
    chartRef.current.appendChild(tooltipDiv);

    // ✅ 实时更新：使用 marketStore 中的实时价格（与交易对价格统一）
    intervalRef.current = setInterval(() => {
      if (!chartInstanceRef.current || !candlestickSeriesRef.current) {
        return;
      }

      // ✅ 使用 marketStore 中的价格（与交易对价格数据源统一）
      const newPrice = currentSymbolPrice > 0 ? currentSymbolPrice : lastPriceRef.current;

      // 如果价格没有变化，跳过更新
      if (newPrice === lastPriceRef.current) {
        return;
      }

      // 更新当前价格
      setCurrentPrice(newPrice);

      // 对齐到周期边界
      const currentTime = Math.floor(Date.now() / 1000);
      const timeSec = Math.floor(currentTime / interval) * interval;

      const lastCandle = klineDataRef.current[klineDataRef.current.length - 1];

      if (timeSec !== lastCandle.time) {
        // 创建新 K 线
        const newCandle = {
          time: timeSec as Time,
          open: Math.round(lastCandle.close),
          high: Math.round(newPrice),
          low: Math.round(newPrice),
          close: Math.round(newPrice),
        };

        candlestickSeriesRef.current.update(newCandle);
        klineDataRef.current.push(newCandle);
        if (klineDataRef.current.length > 300) klineDataRef.current.shift();
      } else {
        // 更新当前 K 线
        const updatedCandle = {
          time: lastCandle.time,
          open: lastCandle.open,
          high: Math.round(Math.max(lastCandle.high, newPrice)),
          low: Math.round(Math.min(lastCandle.low, newPrice)),
          close: Math.round(newPrice),
        };

        candlestickSeriesRef.current.update(updatedCandle);
        klineDataRef.current[klineDataRef.current.length - 1] = updatedCandle;
      }

      lastPriceRef.current = newPrice;
    }, 1000);

    // 响应式调整大小
    const handleResize = () => {
      if (chartInstanceRef.current && chartRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      window.removeEventListener('resize', handleResize);
      
      if (chart) {
        try {
          chart.unsubscribeCrosshairMove(handleCrosshairMove);
        } catch (error) {}
      }
    };
  }, [symbol, height, t, selectedTimeframe]);

  return (
    <div className="relative">
      <div className="absolute top-2 left-2 z-10 flex gap-1 bg-[#1a1a1a] rounded-lg p-1">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setSelectedTimeframe(tf.value)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              selectedTimeframe === tf.value
                ? 'bg-[#2d2d2d] text-white'
                : 'text-gray-400 hover:text-white hover:bg-[#2d2d2d]'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div ref={chartRef} style={{ height }} />
    </div>
  );
}
