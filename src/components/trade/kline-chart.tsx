'use client';

import { useEffect, useState } from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Line,
  ReferenceLine,
} from 'recharts';

interface KlineData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface KlineChartProps {
  symbol: string;
  timeframe: string;
}

export function KlineChart({ symbol, timeframe }: KlineChartProps) {
  const [data, setData] = useState<KlineData[]>([]);
  const [loading, setLoading] = useState(true);

  // 生成模拟 K线数据
  const generateKlineData = (basePrice?: number, existingData?: KlineData[]): KlineData[] => {
    const now = new Date();
    const newData: KlineData[] = [];
    let price = basePrice || 50000;

    // 如果有现有数据，保留前99个，更新最后一个
    if (existingData && existingData.length > 0) {
      // 保留前99个数据点
      newData.push(...existingData.slice(0, -1));

      // 获取最后一个数据点
      const lastData = existingData[existingData.length - 1];
      price = lastData.close;

      // 更新最后一个数据点（模拟实时价格变化）
      const newPrice = price + (Math.random() - 0.5) * 100;
      const newHigh = Math.max(lastData.high, newPrice);
      const newLow = Math.min(lastData.low, newPrice);

      newData.push({
        time: lastData.time,
        open: lastData.open,
        high: newHigh,
        low: newLow,
        close: newPrice,
      });
    } else {
      // 生成初始数据
      for (let i = 100; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 60000);
        const open = price + (Math.random() - 0.5) * 1000;
        const close = open + (Math.random() - 0.5) * 500;
        const high = Math.max(open, close) + Math.random() * 200;
        const low = Math.min(open, close) - Math.random() * 200;

        newData.push({
          time: time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
          open,
          high,
          low,
          close,
        });

        price = close;
      }
    }

    return newData;
  };

  // 初始化加载
  useEffect(() => {
    setLoading(true);
    console.log('[KlineChart] Initializing kline data for:', symbol, timeframe);
    setTimeout(() => {
      setData(generateKlineData());
      setLoading(false);
    }, 500);
  }, [symbol, timeframe]);

  // 实时更新K线数据（每秒更新一次）
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      setData(prevData => {
        const newData = generateKlineData(undefined, prevData);
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, symbol, timeframe]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isUp = data.close >= data.open;

      return (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[160px]">
          <div className="text-xs text-gray-500 mb-2">{data.time}</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">开</span>
              <span className="font-medium">{data.open.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">高</span>
              <span className="font-medium text-green-600">{data.high.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">低</span>
              <span className="font-medium text-red-600">{data.low.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">收</span>
              <span className={`font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                {data.close.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">涨跌</span>
              <span className={`font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                {isUp ? '+' : ''}{((data.close - data.open) / data.open * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-96 bg-slate-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  // 计算价格范围
  const prices = data.flatMap(d => [d.high, d.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;

  const getYPosition = (price: number) => {
    return 96 * 3 - ((price - minPrice) / priceRange) * 96 * 3;
  };

  return (
    <div className="h-96 bg-slate-50 border-b border-gray-200">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 20,
          }}
        >
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="4 4" vertical={true} horizontal={true} strokeOpacity={0.8} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            domain={[minPrice - priceRange * 0.1, maxPrice + priceRange * 0.1]}
            tickFormatter={(value) => value.toFixed(0)}
            orientation="right"
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />

          {/* 自定义K线图 */}
          <Bar
            dataKey="open"
            isAnimationActive={false}
            shape={(props: any) => {
              const { payload, x, y, width } = props;
              const isUp = payload.close >= payload.open;
              const color = isUp ? '#10b981' : '#ef4444'; // green-500 : red-500

              const barWidth = Math.max(width * 0.6, 2);
              const barX = x + width / 2 - barWidth / 2;

              // 计算实体高度
              const openY = getYPosition(payload.open);
              const closeY = getYPosition(payload.close);
              const bodyHeight = Math.abs(closeY - openY) || 1;

              // 计算影线位置
              const highY = getYPosition(payload.high);
              const lowY = getYPosition(payload.low);
              const centerX = x + width / 2;

              return (
                <g>
                  {/* 上影线 */}
                  <line
                    x1={centerX}
                    y1={Math.min(openY, closeY)}
                    x2={centerX}
                    y2={highY}
                    stroke={color}
                    strokeWidth={1}
                  />
                  {/* 下影线 */}
                  <line
                    x1={centerX}
                    y1={Math.max(openY, closeY)}
                    x2={centerX}
                    y2={lowY}
                    stroke={color}
                    strokeWidth={1}
                  />
                  {/* 蜡烛实体 */}
                  <rect
                    x={barX}
                    y={Math.min(openY, closeY)}
                    width={barWidth}
                    height={bodyHeight}
                    fill={color}
                  />
                </g>
              );
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
