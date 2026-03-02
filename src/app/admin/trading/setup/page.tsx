'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface DbStatus {
  success: boolean;
  tables: {
    trading_pairs: {
      exists: boolean;
      hasData: boolean | null;
      error: string | null;
    };
    trading_bots: {
      exists: boolean;
      hasData: boolean | null;
      error: string | null;
    };
  };
  ready: boolean;
}

export default function TradingSetupPage() {
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/trading/check-db');
      const data = await response.json();
      setDbStatus(data);
    } catch (err: any) {
      setError(err.message || '检查数据库失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDatabase();
  }, []);

  if (loading && !dbStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">调控机器人数据库设置</CardTitle>
          <CardDescription>
            按照以下步骤完成数据库初始化
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 数据库状态 */}
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">数据库状态</h3>
              <Button variant="outline" size="sm" onClick={checkDatabase}>
                <RefreshCw className="w-4 h-4 mr-2" />
                刷新状态
              </Button>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-900 rounded-lg mb-4">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-medium">检查失败</p>
                  <p className="text-red-300 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {dbStatus && (
              <div className="space-y-3">
                {/* 交易对表状态 */}
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">trading_pairs 表</p>
                    <p className="text-gray-400 text-sm">
                      {dbStatus.tables.trading_pairs.error || (dbStatus.tables.trading_pairs.exists ? '已创建' : '未创建')}
                    </p>
                  </div>
                  {dbStatus.tables.trading_pairs.exists ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>

                {/* 调控机器人表状态 */}
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">trading_bots 表</p>
                    <p className="text-gray-400 text-sm">
                      {dbStatus.tables.trading_bots.error || (dbStatus.tables.trading_bots.exists ? '已创建' : '未创建')}
                    </p>
                  </div>
                  {dbStatus.tables.trading_bots.exists ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>

                {/* 整体状态 */}
                <div className={`flex items-center justify-between p-4 rounded-lg ${dbStatus.ready ? 'bg-green-900/20 border border-green-900' : 'bg-yellow-900/20 border border-yellow-900'}`}>
                  <div>
                    <p className="text-white font-medium">整体状态</p>
                    <p className="text-gray-400 text-sm">
                      {dbStatus.ready ? '数据库已就绪，可以使用' : '数据库需要初始化'}
                    </p>
                  </div>
                  {dbStatus.ready ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                  )}
                </div>

                {/* Schema 缓存提示 */}
                {!dbStatus.ready && (
                  <div className="bg-blue-900/20 border border-blue-900 rounded-lg p-4">
                    <p className="text-blue-400 text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Schema 缓存延迟提示
                    </p>
                    <p className="text-gray-300 text-sm">
                      如果您已经在 Supabase 中创建了表，但这里仍然显示"未创建"，请等待
                      <span className="text-blue-400 font-medium"> 1-2 分钟</span> 后点击"刷新状态"。
                      这是 Supabase 的 schema 缓存机制导致的正常现象。
                    </p>
                  </div>
                )}

                {dbStatus.ready && (
                  <Button asChild className="w-full mt-4">
                    <a href="/admin/trading/bots">
                      访问调控机器人页面
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* 设置说明 */}
          {!dbStatus?.ready && (
            <div className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-900 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  数据库表创建步骤
                </h3>
                <div className="space-y-4">
                  <div className="bg-slate-800 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">第一步：打开 Supabase SQL Editor</h4>
                    <ol className="space-y-2 text-gray-300 text-sm ml-4">
                      <li>1. 访问 <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">https://app.supabase.com</a></li>
                      <li>2. 选择您的项目</li>
                      <li>3. 点击左侧菜单的 <strong className="text-white">SQL Editor</strong></li>
                      <li>4. 点击 <strong className="text-white">New Query</strong></li>
                    </ol>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">第二步：复制并执行SQL</h4>
                    <p className="text-gray-300 text-sm mb-3">复制下面的SQL代码，粘贴到SQL Editor中，然后点击 <strong className="text-white">Run</strong></p>

                    <div className="relative">
                      <pre className="bg-slate-900 rounded-lg p-4 text-xs text-green-400 overflow-x-auto max-h-80">
{`-- 创建交易对表
CREATE TABLE IF NOT EXISTS trading_pairs (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  currency_id INTEGER NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  min_order_size DECIMAL(20, 8) DEFAULT 0.001,
  max_order_size DECIMAL(20, 8) DEFAULT 999999,
  contract_fee DECIMAL(5, 2) DEFAULT 0.1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trading_pairs_symbol ON trading_pairs(symbol);
CREATE INDEX IF NOT EXISTS idx_trading_pairs_visible ON trading_pairs(is_visible);

-- 创建调控机器人表
CREATE TABLE IF NOT EXISTS trading_bots (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  pair_id INTEGER NOT NULL REFERENCES trading_pairs(id) ON DELETE CASCADE,
  float_value DECIMAL(20, 8) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pair_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_trading_bots_pair_id ON trading_bots(pair_id);
CREATE INDEX IF NOT EXISTS idx_trading_bots_active ON trading_bots(is_active);

-- 插入默认交易对（和前端主页保持一致）
INSERT INTO trading_pairs (symbol, currency_id, is_visible, min_order_size, max_order_size, contract_fee)
VALUES
  -- Forex (16个)
  ('EURUSD', 1, true, 0.001, 999999, 0.1),
  ('GBPUSD', 2, true, 0.001, 999999, 0.1),
  ('USDJPY', 3, true, 0.001, 999999, 0.1),
  ('USDCHF', 4, true, 0.001, 999999, 0.1),
  ('EURAUD', 5, true, 0.001, 999999, 0.1),
  ('EURGBP', 6, true, 0.001, 999999, 0.1),
  ('EURJPY', 7, true, 0.001, 999999, 0.1),
  ('GBPAUD', 8, true, 0.001, 999999, 0.1),
  ('GBPNZD', 9, true, 0.001, 999999, 0.1),
  ('GBPJPY', 10, true, 0.001, 999999, 0.1),
  ('AUDUSD', 11, true, 0.001, 999999, 0.1),
  ('AUDJPY', 12, true, 0.001, 999999, 0.1),
  ('NZDUSD', 13, true, 0.001, 999999, 0.1),
  ('NZDJPY', 14, true, 0.001, 999999, 0.1),
  ('CADJPY', 15, true, 0.001, 999999, 0.1),
  ('CHFJPY', 16, true, 0.001, 999999, 0.1),
  
  -- Gold (2个)
  ('XAUUSD', 17, true, 0.001, 999999, 0.1),
  ('XAGUSD', 18, true, 0.001, 999999, 0.1),
  
  -- Crypto (6个)
  ('BTCUSD', 19, true, 0.001, 999999, 0.1),
  ('ETHUSD', 20, true, 0.001, 999999, 0.1),
  ('LTCUSD', 21, true, 0.001, 999999, 0.1),
  ('SOLUSD', 22, true, 0.001, 999999, 0.1),
  ('XRPUSD', 23, true, 0.001, 999999, 0.1),
  ('DOGEUSD', 24, true, 0.001, 999999, 0.1),
  
  -- Energy (3个)
  ('NGAS', 25, true, 0.001, 999999, 0.1),
  ('UKOIL', 26, true, 0.001, 999999, 0.1),
  ('USOIL', 27, true, 0.001, 999999, 0.1),
  
  -- Indices (3个)
  ('US500', 28, true, 0.001, 999999, 0.1),
  ('ND25', 29, true, 0.001, 999999, 0.1),
  ('AUS200', 30, true, 0.001, 999999, 0.1)
ON CONFLICT (symbol) DO NOTHING;`}
                      </pre>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          const sqlText = document.querySelector('pre')?.textContent;
                          if (sqlText) {
                            navigator.clipboard.writeText(sqlText);
                            toast.success('SQL已复制到剪贴板');
                          }
                        }}
                      >
                        复制SQL
                      </Button>
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">第三步：验证并返回</h4>
                    <ol className="space-y-2 text-gray-300 text-sm ml-4">
                      <li>1. SQL执行成功后会看到 <span className="text-green-400">Success</span> 提示</li>
                      <li>2. 在SQL Editor中执行 <code className="bg-slate-700 px-2 py-1 rounded">SELECT * FROM trading_pairs;</code> 验证</li>
                      <li>3. 返回此页面点击 <strong className="text-white">"刷新状态"</strong> 按钮</li>
                    </ol>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <Button asChild>
                    <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer">
                      打开 Supabase SQL Editor
                    </a>
                  </Button>
                  <Button variant="outline" onClick={checkDatabase} disabled={loading}>
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        刷新中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        刷新状态
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 详细说明 */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">详细说明</h3>
            <p className="text-gray-300 mb-4">
              如果您需要更详细的设置说明，请查看项目根目录下的 <code className="bg-slate-700 px-2 py-1 rounded">DATABASE_SETUP.md</code> 文件。
            </p>
            <div className="bg-slate-900 rounded-lg p-4 text-sm text-gray-400">
              <p>SQL 脚本位置: <code className="text-blue-400">/init-trading-tables.sql</code></p>
              <p className="mt-2">设置文档位置: <code className="text-blue-400">/DATABASE_SETUP.md</code></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
