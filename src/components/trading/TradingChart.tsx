'use client';

import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { CandlestickSeries } from 'lightweight-charts';

interface TradingChartProps {
  symbol?: string;
  height?: number;
}

export default function TradingChart({ symbol = 'BTCUSD', height = 500 }: TradingChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    console.log('[TradingChart] Initializing chart for symbol:', symbol);

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
        mode: 0,
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
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff9c',
      downColor: '#ff4976',
      borderVisible: false,
      wickUpColor: '#00ff9c',
      wickDownColor: '#ff4976',
    });

    // 保存引用
    chartInstanceRef.current = chart;
    seriesRef.current = series;

    // 生成初始K线数据（模拟历史数据）
    const now = new Date();
    const initialData: any[] = [];
    let basePrice = 43200;

    for (let i = 100; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60000); // 每分钟一个数据点
      const open = basePrice + (Math.random() - 0.5) * 1000;
      const close = open + (Math.random() - 0.5) * 500;
      const high = Math.max(open, close) + Math.random() * 200;
      const low = Math.min(open, close) - Math.random() * 200;

      initialData.push({
        time: time.getTime() / 1000,
        open: Math.round(open),
        high: Math.round(high),
        low: Math.round(low),
        close: Math.round(close),
      });

      basePrice = close;
    }

    series.setData(initialData);

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

      const candle = {
        time: Math.floor(Date.now() / 1000),
        open: Math.round(price - 50),
        high: Math.round(price + 80),
        low: Math.round(price - 120),
        close: Math.round(price),
      };

      series.update(candle);
      chart.timeScale().scrollToRealTime();
    }, 1000);

    console.log('[TradingChart] Chart initialized successfully');

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(updateInterval);
      chart.remove();
      console.log('[TradingChart] Chart removed');
    };
  }, [symbol, height]);

  return (
    <div
      ref={chartRef}
      className="w-full bg-[#0a0a0a] rounded-lg overflow-hidden"
      style={{ height: `${height}px` }}
    />
  );
}
