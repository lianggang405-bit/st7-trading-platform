'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, MouseEventParams, Time } from 'lightweight-charts';
import { CandlestickSeries } from 'lightweight-charts';
import { useTranslations } from 'next-intl';

interface TradingChartProps {
  symbol?: string;
  height?: number;
}

// 时间周期类型
type Timeframe = '1M' | '5M' | '15M' | '30M' | '1H' | '4H' | '1D';

// 时间周期配置（单位：秒）
const TIMEFRAMES: { value: Timeframe; label: string; interval: number }[] = [
  { value: '1M', label: '1M', interval: 60 },          // 1分钟 = 60秒
  { value: '5M', label: '5M', interval: 300 },         // 5分钟 = 300秒
  { value: '15M', label: '15M', interval: 900 },       // 15分钟 = 900秒
  { value: '30M', label: '30M', interval: 1800 },      // 30分钟 = 1800秒
  { value: '1H', label: '1H', interval: 3600 },        // 1小时 = 3600秒
  { value: '4H', label: '4H', interval: 14400 },       // 4小时 = 14400秒
  { value: '1D', label: '1D', interval: 86400 },       // 1天 = 86400秒
];

interface KlineData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// 从后端 API 获取实时价格（避免 CORS 问题）
async function getRealPriceFromAPI(symbol: string): Promise<number | null> {
  try {
    const response = await fetch(`/api/market/data?symbols=${symbol}&useRealData=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    
    if (result.success && result.data && result.data[symbol]) {
      return result.data[symbol].price;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

export default function TradingChart({ symbol = 'BTCUSD', height = 500 }: TradingChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const isDisposedRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslations('chart');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1M');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const pricesRef = useRef<number[]>([]);
  const lastCandleRef = useRef<any>(null); // 保存最后一根 K 线

  // 计算时间戳对齐到周期边界（类似欧意交易所）
  function alignTimeToPeriod(timestamp: number, periodSec: number): number {
    return Math.floor(timestamp / periodSec) * periodSec;
  }

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

  useEffect(() => {
    if (chartInstanceRef.current) {
      isDisposedRef.current = true;
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      try {
        chartInstanceRef.current.remove();
      } catch (error) {}
      
      chartInstanceRef.current = null;
    }

    if (!chartRef.current) return;

    isDisposedRef.current = false;
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
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        mouseWheel: true,
        pinch: true,
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
        rightOffset: 12,      // 右侧留白
        barSpacing: 8,        // K线宽度
        minBarSpacing: 6,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
    });

    chartInstanceRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0ECB81',
      downColor: '#F6465D',
      borderUpColor: '#0ECB81',
      borderDownColor: '#F6465D',
      wickUpColor: '#0ECB81',
      wickDownColor: '#F6465D',
    });
    candlestickSeriesRef.current = candlestickSeries;

    const now = new Date();
    const klineData: KlineData[] = [];
    let basePrice = getBasePrice(symbol);
    const prices: number[] = [];
    pricesRef.current = prices;

    for (let i = 200; i >= 0; i--) {
      // interval 现在是秒数，所以直接用秒计算
      const currentTimestamp = Math.floor(now.getTime() / 1000);
      const alignedTimestamp = alignTimeToPeriod(currentTimestamp, interval);
      const timeSec = alignedTimestamp - i * interval;
      const time = new Date(timeSec * 1000);
      const open = basePrice + (Math.random() - 0.5) * 100;
      const close = open + (Math.random() - 0.5) * 50;
      const high = Math.max(open, close) + Math.random() * 20;
      const low = Math.min(open, close) - Math.random() * 20;
      const volume = Math.floor(Math.random() * 1000000);

      klineData.push({
        time: timeSec as Time,
        open: Math.round(open),
        high: Math.round(high),
        low: Math.round(low),
        close: Math.round(close),
        volume,
      });

      prices.push(close);
      basePrice = close;
    }

    candlestickSeries.setData(klineData);

    chart.timeScale().fitContent();
    chart.timeScale().scrollToPosition(5, false);

    setCurrentPrice(basePrice);

    // 保存最后一根 K 线，时间戳对齐到周期边界（类似欧意交易所）
    const lastCandleTime = alignTimeToPeriod(Math.floor(Date.now() / 1000), interval);
    const lastCandle = klineData[klineData.length - 1];
    
    // 检查最后一根 K 线的时间是否与当前周期对齐
    const currentTime = alignTimeToPeriod(Math.floor(Date.now() / 1000), interval);
    
    if (lastCandle.time !== currentTime) {
      // 如果不对齐，创建新的当前 K 线
      lastCandleRef.current = {
        time: currentTime,
        open: Math.round(lastCandle.close),
        high: Math.round(lastCandle.close),
        low: Math.round(lastCandle.close),
        close: Math.round(lastCandle.close),
      };
    } else {
      lastCandleRef.current = {
        time: currentTime,
        open: Math.round(lastCandle.open),
        high: Math.round(lastCandle.high),
        low: Math.round(lastCandle.low),
        close: Math.round(lastCandle.close),
      };
    }

    if (tooltipRef.current && tooltipRef.current.parentNode) {
      try {
        tooltipRef.current.parentNode.removeChild(tooltipRef.current);
      } catch (error) {}
    }

    const tooltipDiv = document.createElement('div');
    tooltipDiv.style.position = 'absolute';
    tooltipDiv.style.zIndex = '1000';
    tooltipDiv.style.background = '#1e1e1e';
    tooltipDiv.style.border = '1px solid #333';
    tooltipDiv.style.borderRadius = '4px';
    tooltipDiv.style.padding = '8px';
    tooltipDiv.style.pointerEvents = 'none';
    tooltipDiv.style.display = 'none';
    tooltipDiv.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)';
    chartRef.current.appendChild(tooltipDiv);
    tooltipRef.current = tooltipDiv;

    const handleCrosshairMove = (param: MouseEventParams) => {
      if (!param.time || !tooltipDiv) {
        tooltipDiv.style.display = 'none';
        return;
      }

      const data = param.seriesData.get(candlestickSeries) as KlineData;
      if (!data) {
        tooltipDiv.style.display = 'none';
        return;
      }

      const dateStr = new Date(data.time as number * 1000).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const priceChange = ((data.close - data.open) / data.open) * 100;
      const isUp = data.close >= data.open;

      tooltipDiv.innerHTML = `
        <div style="color: #999; font-size: 12px; margin-bottom: 4px;">${dateStr}</div>
        <div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 8px;">
          ${symbol}
        </div>
        <div style="font-size: 12px; line-height: 1.6;">
          <div style="display: flex; justify-content: space-between; gap: 16px;">
            <span style="color: #999;">${t('open')}:</span>
            <span style="color: #fff;">${data.open.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px;">
            <span style="color: #999;">${t('high')}:</span>
            <span style="color: ${isUp ? '#00ff9c' : '#ff4976'};">${data.high.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px;">
            <span style="color: #999;">${t('low')}:</span>
            <span style="color: ${isUp ? '#ff4976' : '#00ff9c'};">${data.low.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px;">
            <span style="color: #999;">${t('close')}:</span>
            <span style="color: ${isUp ? '#00ff9c' : '#ff4976'};">${data.close.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; gap: 16px;">
            <span style="color: #999;">${t('change')}:</span>
            <span style="color: ${isUp ? '#00ff9c' : '#ff4976'};">
              ${isUp ? '+' : ''}${priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
      `;

      const priceScaleWidth = chart.priceScale('right').width();
      tooltipDiv.style.left = `${param.point!.x + 10}px`;
      tooltipDiv.style.top = `${param.point!.y - 10}px`;
      tooltipDiv.style.display = 'block';
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    const handleResize = () => {
      if (chartRef.current && chart && !isDisposedRef.current) {
        try {
          chart.applyOptions({
            width: chartRef.current.clientWidth,
          });
        } catch (error) {}
      }
    };

    window.addEventListener('resize', handleResize);

    // ✅ 实时更新：类似欧意交易所，检查周期边界
    let price = basePrice;
    
    intervalRef.current = setInterval(async () => {
      if (isDisposedRef.current || !chartInstanceRef.current) {
        return;
      }

      try {
        const realPrice = await getRealPriceFromAPI(symbol);
        
        if (realPrice !== null && realPrice > 0) {
          // 平滑过渡：新价格 = 旧价格 * 0.7 + 新价格 * 0.3
          price = price * 0.7 + realPrice * 0.3;
        } else {
          // 模拟价格变化
          const change = (Math.random() - 0.5) * 50;
          price += change;
        }
      } catch (error) {
        // 模拟价格变化
        const change = (Math.random() - 0.5) * 50;
        price += change;
      }

      if (isDisposedRef.current || !chartInstanceRef.current) {
        return;
      }

      // 计算当前时间戳（对齐到周期边界）
      const currentTime = alignTimeToPeriod(Math.floor(Date.now() / 1000), interval);
      
      // 更新 K 线（类似欧意交易所逻辑）
      if (lastCandleRef.current) {
        const lastCandle = lastCandleRef.current;
        const newClose = price;

        // 检查是否跨越了周期边界（需要创建新 K 线）
        if (currentTime !== lastCandle.time) {
          // 创建新 K 线，以旧 K 线的收盘价作为开盘价
          const newCandle = {
            time: currentTime,
            open: Math.round(lastCandle.close),
            high: Math.round(newClose),
            low: Math.round(newClose),
            close: Math.round(newClose),
          };

          try {
            if (candlestickSeriesRef.current) {
              candlestickSeriesRef.current.update(newCandle);
            }

            pricesRef.current.push(newClose);
            if (pricesRef.current.length > 200) pricesRef.current.shift();

            setCurrentPrice(newClose);

            chart.timeScale().scrollToPosition(0, true);
          } catch (error) {
            console.error('[K线图] 创建新 K 线失败:', error);
          }

          // 更新引用
          lastCandleRef.current = newCandle;
        } else {
          // 未跨越周期边界，更新当前 K 线
          const newHigh = Math.max(lastCandle.high, newClose);
          const newLow = Math.min(lastCandle.low, newClose);

          const updatedCandle = {
            time: lastCandle.time,
            open: lastCandle.open,
            high: Math.round(newHigh),
            low: Math.round(newLow),
            close: Math.round(newClose),
          };

          try {
            if (candlestickSeriesRef.current) {
              candlestickSeriesRef.current.update(updatedCandle);
            }

            pricesRef.current[pricesRef.current.length - 1] = newClose;

            setCurrentPrice(newClose);
            
            // 滚动到最新位置
            chart.timeScale().scrollToPosition(0, true);
          } catch (error) {
            console.error('[K线图] 更新当前 K 线失败:', error);
          }

          // 更新引用
          lastCandleRef.current = updatedCandle;
        }
      }
    }, 800);

    return () => {
      isDisposedRef.current = true;
      
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

      <div className="absolute top-2 right-2 z-10 bg-[#1a1a1a] rounded-lg px-3 py-1 flex items-center gap-2">
        <span className="text-gray-400 text-xs">{symbol}</span>
        <span className="text-white text-sm font-mono">
          {currentPrice > 0 ? currentPrice.toFixed(2) : 'Loading...'}
        </span>
      </div>

      <div
        ref={chartRef}
        className="w-full bg-[#0a0a0a] rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}
