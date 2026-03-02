/**
 * 美洽客服全局类型定义
 */
declare global {
  interface Window {
    _MICHAT?: {
      (type: string, ...args: any[]): void;
      a?: any[];
    };
  }
}

export {};
