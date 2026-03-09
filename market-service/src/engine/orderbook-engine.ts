/**
 * OrderBook Engine - 订单簿引擎
 * 维护交易对的买卖盘深度数据
 */

/**
 * 价格级别
 */
export interface PriceLevel {
  price: number;
  quantity: number;
}

/**
 * 订单簿数据
 */
export interface OrderBook {
  symbol: string;
  bids: PriceLevel[];        // 买盘（从高到低排序）
  asks: PriceLevel[];        // 卖盘（从低到高排序）
  timestamp: number;         // 最后更新时间
  lastUpdateId: number;      // 最后更新ID（用于增量更新）
}

/**
 * OrderBook Engine 类
 */
export class OrderBookEngine {
  private orderBooks: Map<string, OrderBook> = new Map();

  /**
   * 更新订单簿（全量更新）
   * @param symbol 交易对
   * @param bids 买盘 [[price, quantity], ...]
   * @param asks 卖盘 [[price, quantity], ...]
   * @param lastUpdateId 最后更新ID
   */
  public updateOrderBook(
    symbol: string,
    bids: [number, number][],
    asks: [number, number][],
    lastUpdateId: number
  ): void {
    const upperSymbol = symbol.toUpperCase();

    // 转换为 PriceLevel 数组
    const bidLevels: PriceLevel[] = bids.map(([price, quantity]) => ({ price, quantity }));
    const askLevels: PriceLevel[] = asks.map(([price, quantity]) => ({ price, quantity }));

    // 排序
    bidLevels.sort((a, b) => b.price - a.price); // 买盘从高到低
    askLevels.sort((a, b) => a.price - b.price); // 卖盘从低到高

    // 更新订单簿
    this.orderBooks.set(upperSymbol, {
      symbol: upperSymbol,
      bids: bidLevels,
      asks: askLevels,
      timestamp: Date.now(),
      lastUpdateId,
    });

    // console.log(`[OrderBookEngine] ✅ Updated ${upperSymbol}: ${bidLevels.length} bids, ${askLevels.length} asks`);
  }

  /**
   * 增量更新订单簿
   * @param symbol 交易对
   * @param bids 买盘增量 [[price, quantity], ...]
   * @param asks 卖盘增量 [[price, quantity], ...]
   * @param firstUpdateId 第一个更新ID
   * @param lastUpdateId 最后更新ID
   * @returns 是否更新成功
   */
  public updateOrderBookIncremental(
    symbol: string,
    bids: [number, number][],
    asks: [number, number][],
    firstUpdateId: number,
    lastUpdateId: number
  ): boolean {
    const upperSymbol = symbol.toUpperCase();
    const orderBook = this.orderBooks.get(upperSymbol);

    if (!orderBook) {
      console.log(`[OrderBookEngine] ⚠️  OrderBook not found for ${upperSymbol}, creating new one`);
      this.updateOrderBook(symbol, bids, asks, lastUpdateId);
      return true;
    }

    // 检查更新ID是否连续
    if (orderBook.lastUpdateId + 1 !== firstUpdateId) {
      console.log(
        `[OrderBookEngine] ⚠️  Update ID gap detected for ${upperSymbol}: ` +
        `expected ${orderBook.lastUpdateId + 1}, got ${firstUpdateId}`
      );
      // TODO: 触发全量同步
      return false;
    }

    // 更新买盘
    this.updatePriceLevels(orderBook.bids, bids, 'bid');

    // 更新卖盘
    this.updatePriceLevels(orderBook.asks, asks, 'ask');

    // 更新时间戳和ID
    orderBook.timestamp = Date.now();
    orderBook.lastUpdateId = lastUpdateId;

    // 重新排序
    orderBook.bids.sort((a, b) => b.price - a.price);
    orderBook.asks.sort((a, b) => a.price - b.price);

    return true;
  }

  /**
   * 更新价格级别（增量）
   */
  private updatePriceLevels(
    levels: PriceLevel[],
    updates: [number, number][],
    type: 'bid' | 'ask'
  ): void {
    for (const [price, quantity] of updates) {
      const existingIndex = levels.findIndex(l => l.price === price);

      if (quantity === 0) {
        // 数量为0，删除该价格级别
        if (existingIndex !== -1) {
          levels.splice(existingIndex, 1);
        }
      } else {
        // 更新或新增
        if (existingIndex !== -1) {
          levels[existingIndex].quantity = quantity;
        } else {
          levels.push({ price, quantity });
        }
      }
    }
  }

  /**
   * 获取订单簿
   * @param symbol 交易对
   * @param limit 返回的深度（默认全部）
   * @returns 订单簿数据
   */
  public getOrderBook(symbol: string, limit?: number): OrderBook | null {
    const upperSymbol = symbol.toUpperCase();
    const orderBook = this.orderBooks.get(upperSymbol);

    if (!orderBook) {
      return null;
    }

    if (!limit) {
      return { ...orderBook };
    }

    // 限制深度
    return {
      symbol: orderBook.symbol,
      bids: orderBook.bids.slice(0, limit),
      asks: orderBook.asks.slice(0, limit),
      timestamp: orderBook.timestamp,
      lastUpdateId: orderBook.lastUpdateId,
    };
  }

  /**
   * 获取所有交易对的订单簿
   * @param limit 每个订单簿的深度
   */
  public getAllOrderBooks(limit?: number): OrderBook[] {
    return Array.from(this.orderBooks.values()).map(ob => {
      if (!limit) {
        return { ...ob };
      }
      return {
        symbol: ob.symbol,
        bids: ob.bids.slice(0, limit),
        asks: ob.asks.slice(0, limit),
        timestamp: ob.timestamp,
        lastUpdateId: ob.lastUpdateId,
      };
    });
  }

  /**
   * 检查订单簿是否存在
   */
  public hasOrderBook(symbol: string): boolean {
    return this.orderBooks.has(symbol.toUpperCase());
  }

  /**
   * 获取订单簿数量
   */
  public getOrderBookCount(): number {
    return this.orderBooks.size;
  }

  /**
   * 清理指定交易对的订单簿
   */
  public clearOrderBook(symbol: string): void {
    this.orderBooks.delete(symbol.toUpperCase());
  }

  /**
   * 清理所有订单簿
   */
  public clearAll(): void {
    this.orderBooks.clear();
    console.log('[OrderBookEngine] 🧹 All order books cleared');
  }

  /**
   * 获取统计信息
   */
  public getStats(): { count: number; symbols: string[] } {
    return {
      count: this.orderBooks.size,
      symbols: Array.from(this.orderBooks.keys()),
    };
  }
}

// 导出单例实例
export const orderBookEngine = new OrderBookEngine();
