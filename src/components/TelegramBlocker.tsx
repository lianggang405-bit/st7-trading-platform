'use client'

import { useEffect, useState } from 'react'

export default function TelegramBlocker() {
  const [isTelegram, setIsTelegram] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()

    // 检测 Telegram WebView
    if (ua.includes('telegram')) {
      setIsTelegram(true)
    }
  }, [])

  // 如果不是 Telegram WebView，不显示任何内容
  if (!isTelegram) return null

  const openBrowser = () => {
    const url = window.location.href
    // 在新窗口打开
    window.open(url, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
      <div className="text-center text-white p-6 max-w-sm">
        <h2 className="text-xl font-bold mb-4">
          请在浏览器中打开
        </h2>

        <p className="text-gray-300 mb-6">
          Telegram 内置浏览器不支持后台管理系统
        </p>

        <button
          onClick={openBrowser}
          className="bg-blue-500 hover:bg-blue-600 transition-colors px-6 py-3 rounded-lg font-medium"
        >
          在浏览器打开
        </button>

        <p className="text-gray-400 text-sm mt-4">
          推荐使用 Chrome、Safari 或 Edge 浏览器
        </p>
      </div>
    </div>
  )
}
