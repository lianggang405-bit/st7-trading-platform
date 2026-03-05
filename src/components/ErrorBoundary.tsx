'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // 记录错误到控制台
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);

    // TODO: 发送错误到 Sentry 或其他错误监控服务
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // 使用自定义 fallback 或默认错误 UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <CardTitle className="text-white">出错了</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                抱歉，应用程序遇到了一个错误。我们已经记录了这个问题，请稍后再试。
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400">错误详情:</p>
                  <div className="p-3 bg-slate-900 rounded-md overflow-auto max-h-48">
                    <p className="text-xs text-red-400 font-mono whitespace-pre-wrap">
                      {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <p className="text-xs text-gray-400 font-mono mt-2 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重试
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="default"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  返回首页
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
