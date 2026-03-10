const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8081');

ws.on('open', () => {
  console.log('✅ WebSocket connected');

  // 订阅 XAUUSD
  ws.send(JSON.stringify({
    type: 'subscribe',
    symbol: 'XAUUSD'
  }));

  console.log('📡 Subscribed to XAUUSD');
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());

  if (message.type === 'kline_update') {
    console.log('🕯️ K-line update:', JSON.stringify(message.data, null, 2));
  } else if (message.type === 'ticker_update') {
    console.log('📊 Ticker update:', Object.keys(message.data));
  } else {
    console.log('📨 Message:', message.type);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
  console.log('🔌 WebSocket closed');
});

// 30 秒后断开连接
setTimeout(() => {
  console.log('⏱️ Timeout, closing connection...');
  ws.close();
}, 30000);
