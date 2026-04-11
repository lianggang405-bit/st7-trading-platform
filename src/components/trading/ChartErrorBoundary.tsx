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
    // 静默处理 lightweight-charts 的 dispose 错误
    if (error.message === 'Object is disposed') {
      return { hasError: false, error: null }
    }
    return { hasError: true, error }
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
