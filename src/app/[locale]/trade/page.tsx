'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { AuthGuard } from '../../../components/auth-guard';
import { Price, Change } from '../../../components/data';
import SimpleKlineChart from '../../../components/trading/SimpleKlineChart';
import { ConfirmDialog } from '../../../components/ui/confirm-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useAuthStore } from '../../../stores/authStore';
import { useMarketStore, TradingSymbol } from '../../../stores/marketStore';
import { usePositionStore } from '../../../stores/positionStore';
import { useAssetStore } from '../../../stores/assetStore';
import { useRiskControlStore } from '../../../stores/riskControlStore';
import { useRouter, usePathname } from 'next/navigation';
import { mockSymbols } from '../../../lib/market-mock-data';
import { formatSymbol } from '../../../lib/formatSymbol';
import { getAllOrders, triggerPendingOrder } from '../../../api/trading';
import './mobile.css';

// 类型定义
type Timeframe = '1M' | '5M' | '15M' | '1H' | '1D';

// 转换 Timeframe 到 Binance interval
function timeFrameToInterval(timeframe: Timeframe): string {
  return timeframe.toLowerCase().replace('h', 'h').replace('d', 'd');
}

// 转换 symbol 到 Binance 格式 (BTCUSD -> BTCUSDT)
function symbolToBinance(symbol: string): string {
  if (symbol.endsWith('USD')) {
    return symbol.replace('USD', 'USDT');
  }
  return symbol;
}

export default function TradePage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];
  const t = useTranslations('trade');
  const { isHydrated } = useAuthStore();
  const marketState = useMarketStore();
  const symbols = marketState?.symbols ?? [];
  const currentSymbol = marketState?.currentSymbol;
  const setCurrentSymbol = marketState?.setCurrentSymbol;
  const setSymbols = marketState?.setSymbols;
  const { positions, openPosition, closePosition, updatePositions } = usePositionStore();
  const { freeMargin, onOpenPosition, equity, usedMargin, balance } = useAssetStore();
  const { marginLevel, warning, danger, updateRisk } = useRiskControlStore();

  // 价格脉冲状态
  const [pricePulse, setPricePulse] = useState<'up' | 'down' | null>(null);
  const [symbolPulses, setSymbolPulses] = useState<Record<string, 'up' | 'down' | null>>({});
  const prevPrice = useRef<number | null>(null);
  const prevPrices = useRef<Record<string, number>>({});

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: React.ReactNode;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const [volume, setVolume] = useState("0.1"); // 改为 string 类型，避免输入时自动补零
  const [leverage, setLeverage] = useState<100 | 200 | 300 | 400 | 500>(100);
  const [timeframe, setTimeframe] = useState<Timeframe>('1H');
  const [tradeMode, setTradeMode] = useState<'instant' | 'pending'>('instant');
  const [useStopLoss, setUseStopLoss] = useState(false);
  const [stopLoss, setStopLoss] = useState(''); // 改为空字符串
  const [useTakeProfit, setUseTakeProfit] = useState(false);
  const [takeProfit, setTakeProfit] = useState(''); // 改为空字符串
  const [pendingPrice, setPendingPrice] = useState(0);
  const [isSymbolDropdownOpen, setIsSymbolDropdownOpen] = useState(false);

  // 定期檢查並觸發掛單
  useEffect(() => {
    const checkAndTriggerOrders = async () => {
      try {
        // 獲取所有 pending 订单
        const result = await getAllOrders({ status: 'pending' });
        
        if (result.success && result.orders) {
          for (const order of result.orders) {
            // 獲取当前市场价格
            const symbolData = symbols.find(s => s.symbol === order.symbol);
            if (!symbolData) continue;

            const currentPrice = symbolData.price;

            // 檢查觸發條件
            let shouldTrigger = false;
            if (order.side === 'buy') {
              // 买单：当前价格 <= 挂单价格
              shouldTrigger = currentPrice <= order.openPrice;
            } else {
              // 卖单：当前价格 >= 挂单价格
              shouldTrigger = currentPrice >= order.openPrice;
            }

            // 如果满足触发条件，触发订单
            if (shouldTrigger) {
              await triggerPendingOrder(order.id, currentPrice);
              console.log(`订单 ${order.id} 触发成功，价格：${currentPrice}`);
            }
          }
        }
      } catch (error) {
        console.error('檢查掛單失敗:', error);
      }
    };

    // 每秒檢查一次
    const interval = setInterval(checkAndTriggerOrders, 1000);
    return () => clearInterval(interval);
  }, [symbols]);

  // 从数据库加载数据
  useEffect(() => {
    async function loadSymbols() {
      try {
        const response = await fetch('/api/trading/symbols');
        const data = await response.json();

        if (data.success && data.symbols) {
          setSymbols(data.symbols);
        } else {
          // 如果 API 失敗，使用备用数据
          setSymbols(mockSymbols);
        }
      } catch (error) {
        console.error('Failed to load symbols:', error);
        // 如果 API 失敗，使用备用数据
        setSymbols(mockSymbols);
      }
    }

    if (symbols.length === 0) {
      loadSymbols();
    }
  }, [symbols.length, setSymbols]);

  // 设置默认交易对
  useEffect(() => {
    if (symbols.length > 0) {
      const urlSymbol = new URLSearchParams(window.location.search).get('symbol');
      if (urlSymbol) {
        setCurrentSymbol(urlSymbol);
      } else if (!currentSymbol) {
        setCurrentSymbol('BTCUSD');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCurrentSymbol, symbols.length]);

  // 更新持仓价格和盈亏
  useEffect(() => {
    if (currentSymbol) {
      const symbolData = symbols.find(s => s.symbol === currentSymbol);
      if (symbolData) {
        updatePositions(currentSymbol, symbolData.price);
        // 如果挂单价格未设置或为0，则初始化为当前价格
        if (pendingPrice === 0) {
          setPendingPrice(symbolData.price);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols, currentSymbol, updatePositions]);

  // 更新风控状态
  useEffect(() => {
    updateRisk({ equity, usedMargin });
  }, [equity, usedMargin, updateRisk]);

  // 监听价格变化，触发脉冲动画
  useEffect(() => {
    const newPulses: Record<string, 'up' | 'down' | null> = {};
    let hasChange = false;

    symbols.forEach((symbol) => {
      if (symbol.price !== undefined) {
        const prevSymbolPrice = prevPrices.current[symbol.symbol];

        // 如果有前一次的价格，比较变化
        if (prevSymbolPrice !== undefined) {
          if (symbol.price > prevSymbolPrice) {
            newPulses[symbol.symbol] = 'up';
            hasChange = true;
          } else if (symbol.price < prevSymbolPrice) {
            newPulses[symbol.symbol] = 'down';
            hasChange = true;
          } else {
            newPulses[symbol.symbol] = null;
          }
        } else {
          newPulses[symbol.symbol] = null;
        }

        // 更新前一次的价格
        prevPrices.current[symbol.symbol] = symbol.price;
      }
    });

    // 更新所有交易对的脉冲状态
    if (hasChange) {
      setSymbolPulses(newPulses);

      // 350ms 后重置脉冲状态
      const timer = setTimeout(() => {
        setSymbolPulses({});
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [symbols]);

  // 监听当前交易对价格变化，触发脉冲动画
  useEffect(() => {
    if (currentSymbol) {
      const symbolData = symbols.find(s => s.symbol === currentSymbol);
      if (symbolData && symbolData.price !== undefined) {
        // 如果有前一次的价格，比较变化
        if (prevPrice.current !== null) {
          if (symbolData.price > prevPrice.current) {
            setPricePulse('up');
          } else if (symbolData.price < prevPrice.current) {
            setPricePulse('down');
          }
        }

        // 更新前一次的价格
        prevPrice.current = symbolData.price;

        // 350ms 后重置脉冲状态
        const timer = setTimeout(() => {
          setPricePulse(null);
        }, 350);

        return () => clearTimeout(timer);
      }
    }
  }, [symbols, currentSymbol]);

  // ✅ 禁用实时价格刷新，因为没有可靠的实时价格源
  // 未来应该通过 WebSocket 或 API 获取真实实时价格

  const handleSubmit = async (side: 'buy' | 'sell') => {
    if (!currentSymbol) {
      alert('请先选择交易对');
      return;
    }

    const symbolData = symbols.find(s => s.symbol === currentSymbol);
    if (!symbolData) return;

    // 挂单交易：使用挂单价格；市价交易：使用当前价格
    const orderPrice = tradeMode === 'pending' ? pendingPrice : symbolData.price;
    const orderType = tradeMode === 'pending' ? 'limit' : 'market';

    // 验证挂单价格
    if (tradeMode === 'pending' && pendingPrice <= 0) {
      alert(t('invalidPendingPrice'));
      return;
    }

    const orderAmount = orderPrice * parseFloat(volume);
    const margin = orderAmount / leverage;

    if (freeMargin < margin) {
      alert(t('insufficientMargin'));
      return;
    }

    const action = tradeMode === 'pending' ? t('pendingOrder') : t('instantOrder');
    const direction = side === 'buy' ? t('buy') : t('sell');
    const symbolName = formatSymbol(currentSymbol);

    // 显示确认对话框
    setConfirmDialog({
      open: true,
      title: `${t('confirm')} ${action} ${direction}`,
      description: (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('symbol')}：</span>
            <span className="font-semibold">{symbolName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('direction')}：</span>
            <span className={`font-semibold ${side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
              {direction}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('price')}：</span>
            <span className="font-semibold">{orderPrice.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('volume')}：</span>
            <span className="font-semibold">{volume}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('leverage')}：</span>
            <span className="font-semibold">{leverage}x</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="text-gray-500">Margin：</span>
            <span className="font-bold text-blue-500">{margin.toFixed(2)} USDT</span>
          </div>
        </div>
      ),
      onConfirm: async () => {
        console.log('[TradePage] handleSubmit called:', {
          currentSymbol,
          side,
          volume,
          orderPrice,
          orderType,
          leverage,
          margin,
          freeMargin,
        });

        openPosition({
          symbol: currentSymbol,
          side,
          volume: parseFloat(volume),
          price: orderPrice,
          orderType,
          leverage,
        }).then((result) => {
          console.log('[TradePage] openPosition result:', result);
        });

        alert(`${action} ${direction} ${t('success')}！`);
      },
    });
  };

  const getPricePrecision = (price: number) => {
    return price >= 1000 ? 2 : 4;
  };

  const currentSymbolData = currentSymbol ? symbols.find(s => s.symbol === currentSymbol) : null;

  const timeframes: Timeframe[] = ['1M', '5M', '15M', '1H', '1D'];

  const requiredMargin = currentSymbolData
    ? (currentSymbolData.price * parseFloat(volume)) / leverage
    : 0;

  const estimatedFee = 1; // 固定手续费

  return (
    <AuthGuard>
      <div className="mobile-compact-page min-h-screen bg-gray-50 pb-24">
        {/* 顶部通栏 - 两行结构 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          {/* 第一行：交易对与价格信息栏 */}
          <div className="flex items-center justify-between px-4 py-3 md:py-4">
            {/* 左侧：交易对选择 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSymbolDropdownOpen(!isSymbolDropdownOpen)}
                className="flex items-center gap-1 active:scale-95 transition-transform"
              >
                <span className="text-lg md:text-xl font-bold text-gray-900">
                  {formatSymbol(currentSymbol || 'BTC/USD')}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${isSymbolDropdownOpen ? 'rotate-180' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* 交易对侧边栏 */}
              {isSymbolDropdownOpen && (
                <>
                  {/* 半透明遮罩层 */}
                  <div
                    className="fixed inset-0 bg-gray-900/50 z-10"
                    onClick={() => setIsSymbolDropdownOpen(false)}
                  />
                  {/* 左侧全高侧边栏 - 移动端优化 */}
                  <div className="fixed left-0 top-0 bottom-0 w-64 max-w-[80vw] bg-white z-20 shadow-2xl overflow-y-auto pt-16 pb-4">
                    {symbols.map((symbol) => (
                      <button
                        key={symbol.symbol}
                        onClick={() => {
                          setCurrentSymbol(symbol.symbol);
                          setIsSymbolDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-4 text-left transition-colors active:scale-95 ${
                          currentSymbol === symbol.symbol
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-bold text-lg">{formatSymbol(symbol.symbol)}</div>
                        <div className={`flex items-center gap-2 mt-1 ${
                          currentSymbol === symbol.symbol ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          <Price 
                            value={symbol.price} 
                            precision={getPricePrecision(symbol.price)} 
                            pulse={symbolPulses[symbol.symbol] || null}
                            change={symbol.change}
                          />
                          <Change value={symbol.change} showArrow />
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 右侧：价格和涨跌幅 */}
            {currentSymbolData ? (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-blue-600">
                  <Price 
                    value={currentSymbolData.price} 
                    precision={getPricePrecision(currentSymbolData.price)} 
                    pulse={pricePulse}
                    change={currentSymbolData.change}
                  />
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <Change value={currentSymbolData.change} showArrow />
                </div>
              </div>
            ) : (
              <span className="text-lg font-bold text-gray-400">
                {currentSymbol || 'Loading...'}
              </span>
            )}
          </div>

          {/* 第二行：时间周期选择栏 */}
          <div className="flex items-center justify-center gap-0 px-2 py-2 border-t border-gray-100">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`flex-1 py-2 px-1 text-xs sm:text-sm font-bold transition-colors active:scale-95 ${
                  timeframe === tf
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* K线图区域 */}
        {currentSymbol && (
          <SimpleKlineChart
            symbol={symbolToBinance(currentSymbol)}
            interval={timeFrameToInterval(timeframe)}
            height={500}
            limit={200}
          />
        )}

        {/* 交易操作区 - 中间 */}
        <div className="p-4">
          {/* 交易模式切换 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTradeMode('instant')}
              className={`flex-1 py-3 px-4 text-sm font-bold rounded-full transition-colors active:scale-95 ${
                tradeMode === 'instant'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('instantOrder')}
            </button>
            <button
              onClick={() => setTradeMode('pending')}
              className={`flex-1 py-3 px-4 text-sm font-bold rounded-full transition-colors active:scale-95 ${
                tradeMode === 'pending'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('pendingTrade')}
            </button>
          </div>

          {/* 参数设置区 - 左右分栏布局 */}
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            {/* 倍数 */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-base font-bold text-gray-900">{t('leverage')}</span>
              <Select
                value={leverage.toString()}
                onValueChange={(value) => setLeverage(parseInt(value) as 100 | 200 | 300 | 400 | 500)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="倍数" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100x</SelectItem>
                  <SelectItem value="200">200x</SelectItem>
                  <SelectItem value="300">300x</SelectItem>
                  <SelectItem value="400">400x</SelectItem>
                  <SelectItem value="500">500x</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 止损 */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-gray-900">{t('stopLoss')}</span>
                <button
                  onClick={() => setUseStopLoss(!useStopLoss)}
                  className={`w-12 h-6 rounded-full transition-colors active:scale-95 ${
                    useStopLoss ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      useStopLoss ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const currentLoss = parseFloat(stopLoss) || 0;
                    setStopLoss(Math.max(0, currentLoss - 0.01).toString());
                  }}
                  disabled={!useStopLoss}
                  className={`w-10 h-10 flex items-center justify-center rounded transition-colors active:scale-95 ${
                    useStopLoss
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  -
                </button>
                <input
                  type="text"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={!useStopLoss}
                  value={stopLoss}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 只允许数字和小数点
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setStopLoss(value);
                    }
                  }}
                  className={`w-20 text-right font-bold rounded px-3 py-2 transition-colors text-base ${
                    useStopLoss
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                />
                <button
                  onClick={() => {
                    const currentLoss = parseFloat(stopLoss) || 0;
                    setStopLoss((currentLoss + 0.01).toString());
                  }}
                  disabled={!useStopLoss}
                  className={`w-10 h-10 flex items-center justify-center rounded transition-colors active:scale-95 ${
                    useStopLoss
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  +
                </button>
              </div>
            </div>

            {/* 止盈 */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-gray-900">{t('takeProfit')}</span>
                <button
                  onClick={() => setUseTakeProfit(!useTakeProfit)}
                  className={`w-12 h-6 rounded-full transition-colors active:scale-95 ${
                    useTakeProfit ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      useTakeProfit ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const currentProfit = parseFloat(takeProfit) || 0;
                    setTakeProfit(Math.max(0, currentProfit - 0.01).toString());
                  }}
                  disabled={!useTakeProfit}
                  className={`w-10 h-10 flex items-center justify-center rounded transition-colors active:scale-95 ${
                    useTakeProfit
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  -
                </button>
                <input
                  type="text"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  disabled={!useTakeProfit}
                  value={takeProfit}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 只允许数字和小数点
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setTakeProfit(value);
                    }
                  }}
                  className={`w-20 text-right font-bold rounded px-3 py-2 transition-colors text-base ${
                    useTakeProfit
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                />
                <button
                  onClick={() => {
                    const currentProfit = parseFloat(takeProfit) || 0;
                    setTakeProfit((currentProfit + 0.01).toString());
                  }}
                  disabled={!useTakeProfit}
                  className={`w-10 h-10 flex items-center justify-center rounded transition-colors active:scale-95 ${
                    useTakeProfit
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  +
                </button>
              </div>
            </div>

            {/* 买入数量 */}
            <div className="flex items-center justify-between py-3">
              <span className="text-base font-bold text-gray-900">{t('volume')}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVolume((Math.max(0, parseFloat(volume) - 0.1)).toString())}
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 active:scale-95 transition-all"
                >
                  -
                </button>
                <input
                  type="text"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  value={volume}
                  onChange={(e) => {
                    const value = e.target.value;
                    // 只允许输入数字和小数点，且最多一个小数点
                    if (/^\d*\.?\d*$/.test(value)) {
                      setVolume(value);
                    }
                  }}
                  className="w-20 text-right font-bold bg-gray-100 rounded px-3 py-2 text-base text-lg"
                  style={{ fontSize: '16px' }}
                />
                <button
                  onClick={() => setVolume((parseFloat(volume) + 0.1).toString())}
                  className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>

            {/* 挂单价格 - 仅在挂单交易模式下显示 */}
            {tradeMode === 'pending' && currentSymbolData && (
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <span className="text-base font-bold text-gray-900">{t('pendingPrice')}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPendingPrice(Math.max(0.01, pendingPrice - (currentSymbolData.price || 0) * 0.01 || 0.01))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    step={currentSymbolData.price >= 1000 ? 1 : 0.01}
                    min="0.01"
                    value={pendingPrice}
                    onChange={(e) => setPendingPrice(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
                    className="w-36 text-right font-bold bg-gray-100 rounded px-3 py-2 text-base"
                  />
                  <button
                    onClick={() => setPendingPrice(pendingPrice + ((currentSymbolData.price || 0) * 0.01 || 0.01))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 交易信息展示区 */}
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">{t('perContract')}</span>
              <span className="text-sm font-bold text-gray-900">
                {currentSymbol ? `每張=${formatSymbol(currentSymbol)}` : '--'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">{t('estimatedFee')}</span>
              <span className="text-sm font-bold text-gray-900">{estimatedFee.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">{t('estimatedMargin')}</span>
              <span className="text-sm font-bold text-gray-900">{requiredMargin.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">{t('accountBalance')}</span>
              <span className="text-sm font-bold text-gray-900">{balance.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">{t('availableMargin')}</span>
              <span className="text-sm font-bold text-gray-900">{freeMargin.toFixed(2)}</span>
            </div>
          </div>

          {/* 交易操作按钮 - 买涨/买跌 */}
          <div className="flex gap-3">
            <button
              onClick={() => handleSubmit('buy')}
              disabled={!currentSymbol}
              className={`flex-1 py-4 rounded-full font-bold text-lg transition-colors active:scale-95 ${
                !currentSymbol
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
              }`}
            >
              {t('buy')}
            </button>
            <button
              onClick={() => handleSubmit('sell')}
              disabled={!currentSymbol}
              className={`flex-1 py-4 rounded-full font-bold text-lg transition-colors active:scale-95 ${
                !currentSymbol
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700'
              }`}
            >
              {t('sell')}
            </button>
          </div>
        </div>
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmText={t('confirmTrade')}
        cancelText={t('cancel')}
      />
    </AuthGuard>
  );
}
