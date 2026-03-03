/**
 * Mock 数据使用监控
 *
 * 记录哪些 API 接口频繁使用 mock 数据
 */

// 接口使用统计
interface MockUsageStat {
  endpoint: string;
  count: number;
  lastUsed: Date;
}

const mockUsageMap = new Map<string, MockUsageStat>();

/**
 * 记录 mock 数据使用
 *
 * @param endpoint API 端点路径
 */
export function recordMockUsage(endpoint: string): void {
  const now = new Date();
  const stat = mockUsageMap.get(endpoint);

  if (stat) {
    stat.count++;
    stat.lastUsed = now;
  } else {
    mockUsageMap.set(endpoint, {
      endpoint,
      count: 1,
      lastUsed: now,
    });
  }

  // 输出日志
  console.warn(`[MockUsage] ${endpoint} - 使用 mock 数据 (${stat?.count || 1} 次)`);
}

/**
 * 获取所有 mock 使用统计
 *
 * @returns 使用统计列表
 */
export function getMockUsageStats(): MockUsageStat[] {
  return Array.from(mockUsageMap.values()).sort((a, b) => b.count - a.count);
}

/**
 * 获取指定端点的使用统计
 *
 * @param endpoint API 端点路径
 * @returns 使用统计
 */
export function getMockUsageStat(endpoint: string): MockUsageStat | undefined {
  return mockUsageMap.get(endpoint);
}

/**
 * 重置统计信息
 */
export function resetMockUsageStats(): void {
  mockUsageMap.clear();
  console.log('[MockUsage] 统计信息已重置');
}

/**
 * 获取总使用次数
 *
 * @returns 总次数
 */
export function getTotalMockUsage(): number {
  return Array.from(mockUsageMap.values()).reduce((sum, stat) => sum + stat.count, 0);
}
