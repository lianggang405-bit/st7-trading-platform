'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ChartErrorBoundary extends Component<Props, State> {
  private mounted = false

  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
    this.mounted = false
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidMount() {
    this.mounted = true
  }

  componentWillUnmount() {
    this.mounted = false
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 静默处理 lightweight-charts 的 dispose 错误
    if (error.message === 'Object is disposed') {
      if (this.mounted) {
        this.setState({ hasError: false, error: null })
      }
      return
    }
    console.error('[ChartErrorBoundary] Unexpected error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400">
          <p>Chart temporarily unavailable</p>
        </div>
      )
    }

    return this.props.children
  }
}

// 全局错误处理器，用于捕获 lightweight-charts 渲染错误
if (typeof window !== 'undefined') {
  const originalError = window.onerror
  window.onerror = function (message, source, lineno, colno, error) {
    // 静默处理 lightweight-charts 的 dispose 错误
    if (error && error.message === 'Object is disposed') {
      return true // 阻止错误传播
    }
    // 调用原始错误处理器
    if (originalError) {
      return originalError.call(window, message, source, lineno, colno, error)
    }
    return false
  }

  const originalUnhandledRejection = window.onunhandledrejection
  window.onunhandledrejection = function (event) {
    // 静默处理 lightweight-charts 的 dispose 错误
    if (event.reason && event.reason.message === 'Object is disposed') {
      event.preventDefault()
      return
    }
    if (originalUnhandledRejection) {
      originalUnhandledRejection.call(window, event)
    }
  }
}

export default ChartErrorBoundary
