/**
 * Price Normalizer - 交易对标准化模块
 *
 * 统一不同数据源的交易对格式：
 * - Binance: BTCUSDT, ETHUSDT
 * - TradingView: BTCUSD, ETHUSD
 * - Gold API: XAU, XAG
 * - 本地系统: 统一使用 XXXUSD 格式
 */

/**
 * 交易对格式类型
 */
export enum SymbolFormat {
  BINANCE = 'BINANCE',        // BTCUSDT
  TRADINGVIEW = 'TRADINGVIEW', // BTCUSD
  GOLD_API = 'GOLD_API',      // XAU
  INTERNAL = 'INTERNAL',      // XXXUSD (统一格式)
}

/**
 * 交易对映射配置
 */
interface SymbolMapping {
  internal: string;     // 内部统一格式（XXXUSD）
  binance: string;      // Binance 格式（BTCUSDT）
  tradingview: string;  // TradingView 格式（BTCUSD）
  goldApi: string;      // Gold API 格式（XAU）
  category: 'crypto' | 'metal' | 'forex' | 'energy' | 'cfd';
}

/**
 * 预定义的交易对映射表
 */
const SYMBOL_MAPPINGS: SymbolMapping[] = [
  // === 加密货币 ===
  {
    internal: 'BTCUSD',
    binance: 'BTCUSDT',
    tradingview: 'BTCUSD',
    goldApi: 'BTC',
    category: 'crypto'
  },
  {
    internal: 'ETHUSD',
    binance: 'ETHUSDT',
    tradingview: 'ETHUSD',
    goldApi: 'ETH',
    category: 'crypto'
  },
  {
    internal: 'SOLUSD',
    binance: 'SOLUSDT',
    tradingview: 'SOLUSD',
    goldApi: 'SOL',
    category: 'crypto'
  },
  {
    internal: 'BNBUSD',
    binance: 'BNBUSDT',
    tradingview: 'BNBUSD',
    goldApi: 'BNB',
    category: 'crypto'
  },
  {
    internal: 'XRPUSD',
    binance: 'XRPUSDT',
    tradingview: 'XRPUSD',
    goldApi: 'XRP',
    category: 'crypto'
  },
  {
    internal: 'ADAUSD',
    binance: 'ADAUSDT',
    tradingview: 'ADAUSD',
    goldApi: 'ADA',
    category: 'crypto'
  },
  {
    internal: 'DOGEUSD',
    binance: 'DOGEUSDT',
    tradingview: 'DOGEUSD',
    goldApi: 'DOGE',
    category: 'crypto'
  },
  {
    internal: 'AVAXUSD',
    binance: 'AVAXUSDT',
    tradingview: 'AVAXUSD',
    goldApi: 'AVAX',
    category: 'crypto'
  },
  {
    internal: 'LINKUSD',
    binance: 'LINKUSDT',
    tradingview: 'LINKUSD',
    goldApi: 'LINK',
    category: 'crypto'
  },
  {
    internal: 'DOTUSD',
    binance: 'DOTUSDT',
    tradingview: 'DOTUSD',
    goldApi: 'DOT',
    category: 'crypto'
  },
  {
    internal: 'LTCUSD',
    binance: 'LTCUSDT',
    tradingview: 'LTCUSD',
    goldApi: 'LTC',
    category: 'crypto'
  },
  {
    internal: 'MATICUSD',
    binance: 'MATICUSDT',
    tradingview: 'MATICUSD',
    goldApi: 'MATIC',
    category: 'crypto'
  },

  // === 贵金属 ===
  {
    internal: 'XAUUSD',
    binance: 'XAUUSDT',
    tradingview: 'XAUUSD',
    goldApi: 'XAU',
    category: 'metal'
  },
  {
    internal: 'XAGUSD',
    binance: 'XAGUSDT',
    tradingview: 'XAGUSD',
    goldApi: 'XAG',
    category: 'metal'
  },
  {
    internal: 'XPTUSD',
    binance: 'XPTUSDT',
    tradingview: 'XPTUSD',
    goldApi: 'XPT',
    category: 'metal'
  },
  {
    internal: 'XPDUSD',
    binance: 'XPDUSDT',
    tradingview: 'XPDUSD',
    goldApi: 'XPD',
    category: 'metal'
  },

  // === 外汇 ===
  {
    internal: 'EURUSD',
    binance: 'EURUSDT',
    tradingview: 'EURUSD',
    goldApi: 'EUR',
    category: 'forex'
  },
  {
    internal: 'GBPUSD',
    binance: 'GBPUSDT',
    tradingview: 'GBPUSD',
    goldApi: 'GBP',
    category: 'forex'
  },
  {
    internal: 'USDJPY',
    binance: 'USDJPYUSDT',
    tradingview: 'USDJPY',
    goldApi: 'JPY',
    category: 'forex'
  },
  {
    internal: 'USDCHF',
    binance: 'USDCHFUSDT',
    tradingview: 'USDCHF',
    goldApi: 'CHF',
    category: 'forex'
  },
  {
    internal: 'AUDUSD',
    binance: 'AUDUSDT',
    tradingview: 'AUDUSD',
    goldApi: 'AUD',
    category: 'forex'
  },
  {
    internal: 'NZDUSD',
    binance: 'NZDUSDT',
    tradingview: 'NZDUSD',
    goldApi: 'NZD',
    category: 'forex'
  },
  {
    internal: 'CADUSD',
    binance: 'CADUSDT',
    tradingview: 'CADUSD',
    goldApi: 'CAD',
    category: 'forex'
  },

  // === 能源 ===
  {
    internal: 'USOIL',
    binance: 'USOILUSDT',
    tradingview: 'USOIL',
    goldApi: 'USOIL',
    category: 'energy'
  },
  {
    internal: 'UKOIL',
    binance: 'UKOILUSDT',
    tradingview: 'UKOIL',
    goldApi: 'UKOIL',
    category: 'energy'
  },
  {
    internal: 'NGAS',
    binance: 'NGASUSDT',
    tradingview: 'NGAS',
    goldApi: 'NGAS',
    category: 'energy'
  },
];

/**
 * 按内部格式索引的映射表
 */
const BY_INTERNAL = new Map<string, SymbolMapping>();
/**
 * 按 Binance 格式索引的映射表
 */
const BY_BINANCE = new Map<string, SymbolMapping>();
/**
 * 按 TradingView 格式索引的映射表
 */
const BY_TRADINGVIEW = new Map<string, SymbolMapping>();
/**
 * 按 Gold API 格式索引的映射表
 */
const BY_GOLD_API = new Map<string, SymbolMapping>();

// 初始化索引
for (const mapping of SYMBOL_MAPPINGS) {
  BY_INTERNAL.set(mapping.internal, mapping);
  BY_BINANCE.set(mapping.binance, mapping);
  BY_TRADINGVIEW.set(mapping.tradingview, mapping);
  BY_GOLD_API.set(mapping.goldApi, mapping);
}

/**
 * Price Normalizer 类
 */
export class PriceNormalizer {
  /**
   * 转换交易对格式
   * @param symbol 输入交易对
   * @param fromFormat 输入格式
   * @param toFormat 输出格式
   * @returns 转换后的交易对
   */
  public static convert(
    symbol: string,
    fromFormat: SymbolFormat,
    toFormat: SymbolFormat
  ): string {
    // 如果格式相同，直接返回
    if (fromFormat === toFormat) {
      return symbol;
    }

    let mapping: SymbolMapping | undefined;

    // 根据输入格式查找映射
    switch (fromFormat) {
      case SymbolFormat.INTERNAL:
        mapping = BY_INTERNAL.get(symbol);
        break;
      case SymbolFormat.BINANCE:
        mapping = BY_BINANCE.get(symbol);
        break;
      case SymbolFormat.TRADINGVIEW:
        mapping = BY_TRADINGVIEW.get(symbol);
        break;
      case SymbolFormat.GOLD_API:
        mapping = BY_GOLD_API.get(symbol);
        break;
    }

    if (!mapping) {
      // 如果找不到映射，尝试自动推断
      return this.autoConvert(symbol, fromFormat, toFormat);
    }

    // 根据输出格式返回
    switch (toFormat) {
      case SymbolFormat.INTERNAL:
        return mapping.internal;
      case SymbolFormat.BINANCE:
        return mapping.binance;
      case SymbolFormat.TRADINGVIEW:
        return mapping.tradingview;
      case SymbolFormat.GOLD_API:
        return mapping.goldApi;
    }
  }

  /**
   * 转换为内部格式（XXXUSD）
   */
  public static toInternal(symbol: string, fromFormat: SymbolFormat): string {
    return this.convert(symbol, fromFormat, SymbolFormat.INTERNAL);
  }

  /**
   * 转换为 Binance 格式（XXXUSDT）
   */
  public static toBinance(symbol: string, fromFormat: SymbolFormat): string {
    return this.convert(symbol, fromFormat, SymbolFormat.BINANCE);
  }

  /**
   * 转换为 TradingView 格式（XXXUSD）
   */
  public static toTradingView(symbol: string, fromFormat: SymbolFormat): string {
    return this.convert(symbol, fromFormat, SymbolFormat.TRADINGVIEW);
  }

  /**
   * 自动转换（当映射表中找不到时）
   */
  private static autoConvert(
    symbol: string,
    fromFormat: SymbolFormat,
    toFormat: SymbolFormat
  ): string {
    const upperSymbol = symbol.toUpperCase();

    // 尝试通过后缀识别
    if (upperSymbol.endsWith('USDT')) {
      // Binance 格式
      const base = upperSymbol.replace('USDT', '');
      switch (toFormat) {
        case SymbolFormat.INTERNAL:
          return `${base}USD`;
        case SymbolFormat.BINANCE:
          return upperSymbol;
        case SymbolFormat.TRADINGVIEW:
          return `${base}USD`;
        case SymbolFormat.GOLD_API:
          return base;
      }
    } else if (upperSymbol.endsWith('USD')) {
      // Internal/TradingView 格式
      const base = upperSymbol.replace('USD', '');
      switch (toFormat) {
        case SymbolFormat.INTERNAL:
          return upperSymbol;
        case SymbolFormat.BINANCE:
          return `${base}USDT`;
        case SymbolFormat.TRADINGVIEW:
          return upperSymbol;
        case SymbolFormat.GOLD_API:
          return base;
      }
    }

    // 无法自动转换，返回原值
    console.warn(`[PriceNormalizer] ⚠️  Cannot auto-convert: ${symbol} from ${fromFormat} to ${toFormat}`);
    return upperSymbol;
  }

  /**
   * 获取交易对的分类
   */
  public static getCategory(symbol: string): 'crypto' | 'metal' | 'forex' | 'energy' | 'cfd' {
    // 尝试从映射表中查找
    const mapping = BY_INTERNAL.get(symbol) ||
                    BY_BINANCE.get(symbol) ||
                    BY_TRADINGVIEW.get(symbol) ||
                    BY_GOLD_API.get(symbol);

    if (mapping) {
      return mapping.category;
    }

    // 根据关键字自动分类
    const upper = symbol.toUpperCase();

    // 贵金属
    if (['XAU', 'XAG', 'XPT', 'XPD'].some(k => upper.includes(k))) {
      return 'metal';
    }

    // 能源
    if (['USOIL', 'UKOIL', 'NGAS'].some(k => upper.includes(k))) {
      return 'energy';
    }

    // 外汇
    if (['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'NZD', 'CAD'].some(k => upper.includes(k))) {
      return 'forex';
    }

    // 加密货币（默认）
    return 'crypto';
  }

  /**
   * 获取所有支持的交易对
   */
  public static getAllSymbols(format: SymbolFormat = SymbolFormat.INTERNAL): string[] {
    return SYMBOL_MAPPINGS.map(m => {
      switch (format) {
        case SymbolFormat.INTERNAL:
          return m.internal;
        case SymbolFormat.BINANCE:
          return m.binance;
        case SymbolFormat.TRADINGVIEW:
          return m.tradingview;
        case SymbolFormat.GOLD_API:
          return m.goldApi;
      }
    });
  }

  /**
   * 按分类获取交易对
   */
  public static getSymbolsByCategory(
    category: 'crypto' | 'metal' | 'forex' | 'energy' | 'cfd',
    format: SymbolFormat = SymbolFormat.INTERNAL
  ): string[] {
    return SYMBOL_MAPPINGS
      .filter(m => m.category === category)
      .map(m => {
        switch (format) {
          case SymbolFormat.INTERNAL:
            return m.internal;
          case SymbolFormat.BINANCE:
            return m.binance;
          case SymbolFormat.TRADINGVIEW:
            return m.tradingview;
          case SymbolFormat.GOLD_API:
            return m.goldApi;
        }
      });
  }

  /**
   * 添加新的交易对映射
   */
  public static addMapping(mapping: SymbolMapping): void {
    SYMBOL_MAPPINGS.push(mapping);
    BY_INTERNAL.set(mapping.internal, mapping);
    BY_BINANCE.set(mapping.binance, mapping);
    BY_TRADINGVIEW.set(mapping.tradingview, mapping);
    BY_GOLD_API.set(mapping.goldApi, mapping);
  }
}

// 导出单例
export const priceNormalizer = new PriceNormalizer();
