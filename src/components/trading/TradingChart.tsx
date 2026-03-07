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
  const priceLineRef = useRef<any>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const t = useTranslations('chart');
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1M');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const lastPriceRef = useRef<number>(0);
  const lastCandleRef = useRef<KlineData | null>(null);
  const minPriceRef = useRef<number>(Infinity);
  const maxPriceRef = useRef<number>(-Infinity);
  const { symbols } = useMarketStore();

  // ✅ 获取当前交易对的实时价格
  const currentSymbolData = symbols.find(s => s.symbol === symbol);
  const currentSymbolPrice = currentSymbolData?.price || 0;

  // ✅ 计算价格范围（根据价格大小动态调整）
  const getPriceRange = (price: number): number => {
    if (price > 50000) return 5000; // BTC等高价币
    if (price > 5000) return 500; // ETH等中价币
    if (price > 100) return 50; // 其他
    return 10; // 低价币
  };

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

  // ✅ 初始化图表
  useEffect(() => {
    // ✅ 等待实时价格加载完成后再初始化K线，避免价格不一致
    if (!chartRef.current || currentSymbolPrice === 0) {
      return;
    }

    const timeframeConfig = TIMEFRAMES.find(tf => tf.value === selectedTimeframe) || TIMEFRAMES[0];
    const interval = timeframeConfig.interval;

    // 创建图表
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
      rightPriceScale: {
        borderColor: '#333',
        scaleMargins: {
          top: 0.25, // 顶部保留25%空白，减少价格轴跳动
          bottom: 0.25, // 底部保留25%空白，减少价格轴跳动
        },
        autoScale: false, // ✅ 禁用自动缩放，固定价格轴
      },
      timeScale: {
        borderColor: '#333',
        timeVisible: true,
        secondsVisible: false,
        rightBarStaysOnScroll: true,
      },
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
      localization: {
        priceFormatter: (price: number) => price.toFixed(0), // ✅ 价格格式化为整数
      },
    });

    // 添加K线系列
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff9c',
      downColor: '#ff4976',
      borderVisible: false,
      wickUpColor: '#00ff9c',
      wickDownColor: '#ff4976',
      priceFormat: {
        type: 'price',
        precision: 0, // ✅ 价格精度为0（整数）
        minMove: 1, // ✅ 最小移动单位为1
      },
    });

    chartInstanceRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // 生成初始 K 线数据
    const klineData: KlineData[] = [];

    // ✅ 使用实时价格作为K线初始价格（确保与交易对价格一致）
    let basePrice = currentSymbolPrice;

    for (let i = 200; i >= 0; i--) {
      const timeSec = Math.floor(Date.now() / 1000) - i * interval;
      const open = basePrice;
      const close = open + (Math.random() - 0.5) * 200;
      const high = Math.max(open, close) + Math.random() * 100;
      const low = Math.min(open, close) - Math.random() * 100;

      klineData.push({
        time: timeSec as Time,
        open: Math.round(open),
        high: Math.round(high),
        low: Math.round(low),
        close: Math.round(close),
      });

      basePrice = close;
    }

    // 设置初始数据
    candlestickSeries.setData(klineData);
    chart.timeScale().fitContent();
    chart.timeScale().scrollToPosition(5, false);

    // 存储最后一根K线和初始价格
    lastCandleRef.current = klineData[klineData.length - 1];
    lastPriceRef.current = basePrice;
    setCurrentPrice(basePrice);

    // ✅ 初始化价格范围（固定价格轴，避免跳动）
    const priceRange = getPriceRange(basePrice);
    minPriceRef.current = basePrice - priceRange;
    maxPriceRef.current = basePrice + priceRange;
    chart.priceScale('right').setVisibleRange({
      from: minPriceRef.current,
      to: maxPriceRef.current,
    });

    // ✅ 创建最新价格线（虚线）
    const priceLine = candlestickSeries.createPriceLine({
      price: basePrice,
      color: '#888',
      lineWidth: 1,
      lineStyle: 2, // 2 = 虚线
      axisLabelVisible: true,
    });
    priceLineRef.current = priceLine;

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

      // 获取图表尺寸
      const chartWidth = chartRef.current!.clientWidth;
      const chartHeight = chartRef.current!.clientHeight;

      // 智能定位：避免tooltip超出边界
      let offsetX = 15;
      let offsetY = 15;

      // 如果鼠标在右侧，tooltip显示在左侧
      if (param.point.x > chartWidth - 200) {
        offsetX = -220; // 向左偏移
      }

      // 如果鼠标在下方，tooltip显示在上方
      if (param.point.y < 150) {
        offsetY = 15; // 向下显示
      } else if (param.point.y > chartHeight - 150) {
        offsetY = -130; // 向上偏移
      }

      tooltipRef.current.style.display = 'block';
      tooltipRef.current.style.left = param.point.x + offsetX + 'px';
      tooltipRef.current.style.top = param.point.y + offsetY + 'px';

      const timeValue = typeof data.time === 'number' ? data.time * 1000 : (typeof data.time === 'string' ? new Date(data.time).getTime() : 0);
      const formattedTime = new Date(timeValue).toLocaleString();
      tooltipRef.current.innerHTML = `
        <div style="color: #999; font-size: 12px; margin-bottom: 6px; border-bottom: 1px solid #333; padding-bottom: 4px;">${formattedTime}</div>
        <div style="color: ${data.close >= data.open ? '#00ff9c' : '#ff4976'}; font-size: 14px; font-weight: bold; margin-bottom: 4px;">${t('close')}: ${data.close}</div>
        <div style="color: #999; font-size: 12px;">${t('open')}: ${data.open}</div>
        <div style="color: #999; font-size: 12px;">${t('high')}: ${data.high}</div>
        <div style="color: #999; font-size: 12px;">${t('low')}: ${data.low}</div>
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

    // ✅ 实时更新 - 按照稳定版的逻辑
    intervalRef.current = setInterval(() => {
      if (!chartInstanceRef.current || !candlestickSeriesRef.current || !priceLineRef.current) {
        return;
      }

      // 获取最新价格（优先使用外部真实价格，否则模拟）
      let newPrice = currentSymbolPrice > 0 ? currentSymbolPrice : lastPriceRef.current;

      // 如果没有外部价格，使用模拟价格
      if (newPrice === lastPriceRef.current && currentSymbolPrice === 0) {
        newPrice = lastPriceRef.current + (Math.random() - 0.5) * 150;
      }

      // ✅ 价格变化阈值检测：只有价格变化超过当前价格的0.1%才更新，减少跳动
      const priceChangeThreshold = currentSymbolPrice * 0.001; // 0.1%
      const priceDiff = Math.abs(newPrice - lastPriceRef.current);
      
      if (priceDiff < priceChangeThreshold) {
        return; // 价格变化太小，跳过更新
      }

      // 更新状态
      setCurrentPrice(newPrice);

      const lastCandle = lastCandleRef.current;
      if (!lastCandle) return;

      // 对齐到周期边界
      const currentTime = Math.floor(Date.now() / 1000);
      const timeSec = Math.floor(currentTime / interval) * interval;

      // 确保 lastCandle.time 是数字类型
      const lastCandleTime = typeof lastCandle.time === 'number' ? lastCandle.time : parseInt(String(lastCandle.time), 10);

      if (timeSec > lastCandleTime) {
        // 创建新 K 线
        const newCandle = {
          time: timeSec as Time,
          open: Math.round(lastCandle.close),
          high: Math.round(newPrice),
          low: Math.round(newPrice),
          close: Math.round(newPrice),
        };

        candlestickSeriesRef.current.update(newCandle);
        lastCandleRef.current = newCandle;
      } else {
        // 更新当前 K 线
        const updatedCandle = {
          time: lastCandleTime as Time,
          open: lastCandle.open,
          high: Math.round(Math.max(lastCandle.high, newPrice)),
          low: Math.round(Math.min(lastCandle.low, newPrice)),
          close: Math.round(newPrice),
        };

        candlestickSeriesRef.current.update(updatedCandle);
        lastCandleRef.current = updatedCandle;
      }

      // ✅ 更新价格虚线
      priceLineRef.current.applyOptions({
        price: newPrice,
        color: newPrice >= lastCandle.open ? '#00ff9c' : '#ff4976', // 涨绿跌红
      });

      // ✅ 价格范围检测：只有价格突破当前范围时才重新计算
      if (newPrice > maxPriceRef.current || newPrice < minPriceRef.current) {
        const priceRange = getPriceRange(newPrice);
        minPriceRef.current = newPrice - priceRange;
        maxPriceRef.current = newPrice + priceRange;
        chartInstanceRef.current.priceScale('right').setVisibleRange({
          from: minPriceRef.current,
          to: maxPriceRef.current,
        });
      }

      // ✅ 强制滚动到最新时间
      chartInstanceRef.current.timeScale().scrollToRealTime();

      lastPriceRef.current = newPrice;
    }, 1000); // 1秒更新一次

    // 响应式调整大小
    const handleResize = () => {
      if (chartInstanceRef.current && chartRef.current) {
        chartInstanceRef.current.applyOptions({
          width: chartRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      window.removeEventListener('resize', handleResize);

      // 移除价格线
      if (priceLineRef.current && candlestickSeriesRef.current) {
        candlestickSeriesRef.current.removePriceLine(priceLineRef.current);
        priceLineRef.current = null;
      }

      if (chart) {
        try {
          chart.unsubscribeCrosshairMove(handleCrosshairMove);
          chart.remove();
        } catch (error) {}
      }
    };
  }, [symbol, height, selectedTimeframe, t, currentSymbolPrice]); // 添加 currentSymbolPrice 依赖

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
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>
      <div ref={chartRef} style={{ width: '100%', height: `${height}px` }} />
    </div>
  );
}
