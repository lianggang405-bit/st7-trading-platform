'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 静默处理 lightweight-charts 的 dispose 错误
    if (error.message === 'Object is disposed') {
      console.warn('[ChartErrorBoundary] Caught expected dispose error, ignoring')
      this.setState({ hasError: false, error: null })
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

export default ChartErrorBoundary
