'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, MouseEventParams, Time } from 'lightweight-charts';
import { CandlestickSeries, LineSeries } from 'lightweight-charts';
import { useTranslations } from 'next-intl';

interface TradingChartProps {
  symbol?: string;
  height?: number;
}

// 时间周期类型
type Timeframe = '1M' | '5M' | '15M' | '30M' | '1H' | '4H' | '1D';

// 时间周期配置
const TIMEFRAMES: { value: Timeframe; label: string; interval: number }[] = [
  { value: '1M', label: '1M', interval: 60000 },      // 1分钟
  { value: '5M', label: '5M', interval: 300000 },     // 5分钟
  { value: '15M', label: '15M', interval: 900000 },   // 15分钟
  { value: '30M', label: '30M', interval: 1800000 },  // 30分钟
  { value: '1H', label: '1H', interval: 3600000 },    // 1小时
  { value: '4H', label: '4H', interval: 14400000 },   // 4小时
  { value: '1D', label: '1D', interval: 86400000 },   // 1天
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
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const t = useTranslations('chart');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1M');

  useEffect(() => {
    if (!chartRef.current) return;

    console.log('[TradingChart] Initializing chart for symbol:', symbol, 'timeframe:', selectedTimeframe);

    // 获取当前时间周期的间隔
    const timeframeConfig = TIMEFRAMES.find(tf => tf.value === selectedTimeframe) || TIMEFRAMES[0];
    const interval = timeframeConfig.interval;

    // 创建图表实例
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
        mode: 1, // 十字线模式
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

    // 添加K线系列
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff9c',      // 上涨颜色：绿色
      downColor: '#ff4976',    // 下跌颜色：红色
      borderVisible: false,
      wickUpColor: '#00ff9c',  // 上涨影线颜色
      wickDownColor: '#ff4976',// 下跌影线颜色
    });

    // 添加MA5均线
    const ma5Series = chart.addSeries(LineSeries, {
      color: '#f7931a', // 橙色
      lineWidth: 1,
      title: 'MA5',
    });

    // 添加MA10均线
    const ma10Series = chart.addSeries(LineSeries, {
      color: '#4caf50', // 绿色
      lineWidth: 1,
      title: 'MA10',
    });

    // 添加MA20均线
    const ma20Series = chart.addSeries(LineSeries, {
      color: '#2196f3', // 蓝色
      lineWidth: 1,
      title: 'MA20',
    });

    // 生成初始K线数据（模拟历史数据）
    const now = new Date();
    const klineData: KlineData[] = [];
    const ma5Data: { time: Time; value: number }[] = [];
    const ma10Data: { time: Time; value: number }[] = [];
    const ma20Data: { time: Time; value: number }[] = [];

    let basePrice = 43200;
    const prices: number[] = [];

    for (let i = 200; i >= 0; i--) {
      const time = new Date(now.getTime() - i * interval); // 使用选中的时间间隔
      const open = basePrice + (Math.random() - 0.5) * 1000;
      const close = open + (Math.random() - 0.5) * 500;
      const high = Math.max(open, close) + Math.random() * 200;
      const low = Math.min(open, close) - Math.random() * 200;
      const volume = Math.floor(Math.random() * 1000000);

      klineData.push({
        time: (time.getTime() / 1000) as Time,
        open: Math.round(open),
        high: Math.round(high),
        low: Math.round(low),
        close: Math.round(close),
        volume,
      });

      prices.push(close);
      basePrice = close;

      // 计算MA均线
      if (prices.length >= 5) {
        const ma5 = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
        ma5Data.push({ time: (time.getTime() / 1000) as Time, value: Math.round(ma5) });
      }

      if (prices.length >= 10) {
        const ma10 = prices.slice(-10).reduce((a, b) => a + b, 0) / 10;
        ma10Data.push({ time: (time.getTime() / 1000) as Time, value: Math.round(ma10) });
      }

      if (prices.length >= 20) {
        const ma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
        ma20Data.push({ time: (time.getTime() / 1000) as Time, value: Math.round(ma20) });
      }
    }

    candlestickSeries.setData(klineData);
    ma5Series.setData(ma5Data);
    ma10Series.setData(ma10Data);
    ma20Series.setData(ma20Data);

    // 创建自定义tooltip
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

    // 十字线移动事件
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

    // 响应式调整大小
    const handleResize = () => {
      if (chartRef.current && chart) {
        chart.applyOptions({
          width: chartRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // 实时更新K线（模拟）
    let price = basePrice;
    const updateInterval = setInterval(() => {
      price += (Math.random() - 0.5) * 200;
      const newClose = price;
      const newOpen = price - 50;
      const newHigh = price + 80;
      const newLow = price - 120;

      const newCandle = {
        time: Math.floor(Date.now() / 1000) as Time,
        open: Math.round(newOpen),
        high: Math.round(newHigh),
        low: Math.round(newLow),
        close: Math.round(newClose),
      };

      // 更新K线
      candlestickSeries.update(newCandle);

      // 更新价格数组并计算MA
      prices.push(newClose);
      if (prices.length > 200) prices.shift();

      // 更新MA5
      if (prices.length >= 5) {
        const ma5 = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
        ma5Series.update({ time: Math.floor(Date.now() / 1000) as Time, value: Math.round(ma5) });
      }

      // 更新MA10
      if (prices.length >= 10) {
        const ma10 = prices.slice(-10).reduce((a, b) => a + b, 0) / 10;
        ma10Series.update({ time: Math.floor(Date.now() / 1000) as Time, value: Math.round(ma10) });
      }

      // 更新MA20
      if (prices.length >= 20) {
        const ma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
        ma20Series.update({ time: Math.floor(Date.now() / 1000) as Time, value: Math.round(ma20) });
      }

      chart.timeScale().scrollToRealTime();
    }, 1000);

    console.log('[TradingChart] Chart initialized successfully');

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(updateInterval);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      if (tooltipDiv && tooltipDiv.parentNode) {
        tooltipDiv.parentNode.removeChild(tooltipDiv);
      }
      chart.remove();
      console.log('[TradingChart] Chart removed');
    };
  }, [symbol, height, t, selectedTimeframe]);

  return (
    <div className="relative">
      {/* 时间周期选择器 */}
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

      <div
        ref={chartRef}
        className="w-full bg-[#0a0a0a] rounded-lg overflow-hidden"
        style={{ height: `${height}px` }}
      />
      {/* MA 均线图例 */}
      <div className="absolute top-2 right-2 flex gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 bg-[#f7931a]"></div>
          <span className="text-gray-400">MA5</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 bg-[#4caf50]"></div>
          <span className="text-gray-400">MA10</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-1 bg-[#2196f3]"></div>
          <span className="text-gray-400">MA20</span>
        </div>
      </div>
    </div>
  );
}
