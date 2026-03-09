'use client';

export default function TestAdminPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <h1 className="text-2xl font-bold mb-4">Admin Test Page</h1>
        <p className="text-gray-400">如果您能看到这个页面，说明 Telegram WebView 可以正常工作。</p>
        <p className="text-sm text-gray-500 mt-4">Current time: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
}
