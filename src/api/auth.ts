/**
 * 用户认证 API
 */

import { apiClient } from './client';

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  accountType?: 'demo' | 'real';
}

export interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  accountType: 'demo' | 'real';
  createdAt: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterResponse {
  userId: string;
}

/**
 * 用户登录
 */
export async function login(params: LoginParams): Promise<{ success: boolean; user?: User; error?: string }> {
  const response = await apiClient.post<any>('/api/auth/validate', params);

  if (response.success && response.data?.user) {
    // 生成并保存 token（统一格式：token_<userId>_<timestamp>）
    const token = `token_${response.data.user.id}_${Date.now()}`;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(response.data.user));

    // 同步到 cookie（确保后续 API 调用可以获取 token）
    if (typeof document !== 'undefined') {
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=lax`;
    }

    return {
      success: true,
      user: response.data.user,
    };
  }

  return {
    success: false,
    error: response.error || '登录失败',
  };
}

/**
 * 用户注册
 */
export async function register(params: RegisterParams): Promise<{ success: boolean; userId?: string; error?: string }> {
  const response = await apiClient.post<any>('/api/auth/register', params);

  if (response.success && response.data) {
    return {
      success: true,
      userId: response.data.userId || response.data.id,
    };
  }

  return {
    success: false,
    error: response.error || '注册失败',
  };
}

/**
 * 用户登出
 */
export async function logout(): Promise<void> {
  // 清除本地存储
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // 清除 cookie（确保使用 SameSite=lax）
  if (typeof document !== 'undefined') {
    document.cookie = 'token=; path=/; max-age=0; SameSite=lax';
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<{ success: boolean; user?: User; error?: string }> {
  const response = await apiClient.get<User>('/api/auth/me');

  if (response.success && response.data) {
    return {
      success: true,
      user: response.data,
    };
  }

  return {
    success: false,
    error: response.error || '获取用户信息失败',
  };
}

/**
 * 从本地存储恢复用户信息
 */
export function getUserFromStorage(): User | null {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('[Auth API] Failed to parse user from storage:', error);
      localStorage.removeItem('user');
    }
  }
  return null;
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  return !!localStorage.getItem('token');
}

/**
 * 获取 token
 */
export function getToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * 获取用户信用分
 */
export async function getCreditScore(): Promise<{ success: boolean; creditScore?: number; error?: string }> {
  const response = await apiClient.get<{ creditScore: number }>('/api/user/credit-score');

  if (response.success && response.data) {
    return {
      success: true,
      creditScore: response.data.creditScore,
    };
  }

  return {
    success: false,
    error: response.error || '获取信用分失败',
  };
}
