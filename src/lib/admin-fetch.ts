/**
 * 管理端 API 客户端
 * 自动在请求中携带 admin token
 */

export async function adminFetch(url: string, options: RequestInit = {}) {
  // 从 localStorage 获取 token
  let token: string | null = null;

  if (typeof window !== 'undefined') {
    token = localStorage.getItem('admin_token');
  }

  // 如果没有 token，返回 401 错误
  if (!token) {
    throw new Error('Unauthorized - No admin token found');
  }

  // 添加 Authorization header
  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // 如果返回 401，清除本地 token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
    throw new Error('Unauthorized');
  }

  return response;
}

export default adminFetch;
