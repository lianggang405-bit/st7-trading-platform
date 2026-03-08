/**
 * K线实时推送服务
 * 使用 SSE (Server-Sent Events) 实现实时K线推送
 */

interface Client {
  id: string;
  symbols: Set<string>;
  intervals: Set<string>;
  response: any;
}

class KlineStreamService {
  private clients: Map<string, Client> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * 添加客户端
   */
  addClient(clientId: string, response: any, symbols: string[], intervals: string[]) {
    const client: Client = {
      id: clientId,
      symbols: new Set(symbols),
      intervals: new Set(intervals),
      response,
    };

    this.clients.set(clientId, client);
    console.log(`[KlineStream] 客户端连接: ${clientId}, 交易对: ${symbols.join(', ')}, 周期: ${intervals.join(', ')}`);

    // 发送连接成功消息
    this.sendEvent(client, 'connected', {
      clientId,
      symbols,
      intervals,
      timestamp: Date.now(),
    });
  }

  /**
   * 移除客户端
   */
  removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      console.log(`[KlineStream] 客户端断开: ${clientId}`);
    }
  }

  /**
   * 更新客户端订阅
   */
  updateSubscription(clientId: string, symbols: string[], intervals: string[]) {
    const client = this.clients.get(clientId);
    if (client) {
      client.symbols = new Set(symbols);
      client.intervals = new Set(intervals);
      console.log(`[KlineStream] 客户端订阅更新: ${clientId}`);
    }
  }

  /**
   * 发送事件到客户端
   */
  private sendEvent(client: Client, event: string, data: any) {
    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      client.response.write(message);
    } catch (error) {
      console.error(`[KlineStream] 发送消息失败: ${client.id}`, error);
      this.removeClient(client.id);
    }
  }

  /**
   * 广播K线更新到所有订阅的客户端
   */
  broadcastKline(symbol: string, interval: string, kline: any) {
    this.clients.forEach((client) => {
      // 检查客户端是否订阅了该交易对和周期
      if (client.symbols.has(symbol) && client.intervals.has(interval)) {
        this.sendEvent(client, 'kline', {
          symbol,
          interval,
          kline,
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * 广播价格更新到所有订阅的客户端
   */
  broadcastPrice(symbol: string, price: number, change: number) {
    this.clients.forEach((client) => {
      if (client.symbols.has(symbol)) {
        this.sendEvent(client, 'price', {
          symbol,
          price,
          change,
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * 开始模拟实时推送（开发环境）
   */
  startSimulation() {
    if (this.updateInterval) {
      return;
    }

    console.log('[KlineStream] 启动模拟实时推送');

    this.updateInterval = setInterval(() => {
      // 模拟K线更新（每秒更新部分交易对）
      this.clients.forEach((client) => {
        client.symbols.forEach((symbol) => {
          client.intervals.forEach((interval) => {
            // 模拟最后一根K线更新
            const mockKline = this.generateMockKlineUpdate(symbol);
            this.broadcastKline(symbol, interval, mockKline);
          });
        });
      });
    }, 1000);
  }

  /**
   * 生成模拟K线更新
   */
  private generateMockKlineUpdate(symbol: string): any {
    const now = Date.now();
    // 对齐到时间周期的开始时间
    const intervalMs = 60000; // 1分钟
    const time = Math.floor(now / intervalMs) * intervalMs;

    // 根据交易对生成合理的价格
    let basePrice = 0;
    if (symbol.includes('BTC')) basePrice = 67000;
    else if (symbol.includes('ETH')) basePrice = 3500;
    else if (symbol.includes('XAU')) basePrice = 2850;
    else if (symbol.includes('EUR')) basePrice = 1.08;
    else if (symbol.includes('USD')) basePrice = 1.0;
    else basePrice = 100.0;

    // 添加随机波动
    const volatility = basePrice * 0.0001; // 0.01% 波动
    const open = basePrice + (Math.random() - 0.5) * volatility;
    const change = (Math.random() - 0.5) * volatility;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.random() * 1000;

    return {
      time,
      open,
      high,
      low,
      close,
      volume,
    };
  }

  /**
   * 停止模拟推送
   */
  stopSimulation() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('[KlineStream] 停止模拟实时推送');
    }
  }

  /**
   * 获取连接统计
   */
  getStats() {
    return {
      totalClients: this.clients.size,
      clients: Array.from(this.clients.values()).map((c) => ({
        id: c.id,
        symbols: Array.from(c.symbols),
        intervals: Array.from(c.intervals),
      })),
    };
  }
}

// 导出单例
export const klineStreamService = new KlineStreamService();

// 开发环境自动启动模拟推送
if (process.env.NODE_ENV === 'development') {
  klineStreamService.startSimulation();
}
