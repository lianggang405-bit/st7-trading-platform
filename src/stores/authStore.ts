import { create } from 'zustand';
import { createUser, validateUser, MockUser } from '../lib/user-mock-data';
import { useAssetStore } from './assetStore';
import * as authApi from '@/api/auth';

export type AccountType = 'demo' | 'real';

export interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  accountType: AccountType; // 账户类型：模拟账户/正式账户
  userType?: AccountType; // 用户类型（兼容字段，某些API可能返回此字段）
  createdAt: string;
  creditScore?: number; // 信用分
}

interface AuthState {
  isLogin: boolean;
  token: string | null;
  user: User | null;
  isHydrated: boolean; // 是否已从 localStorage 恢复状态
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, accountType?: AccountType) => Promise<{ userId: string }>;
  hydrateFromCookie: () => void;
  syncFromBackend: () => Promise<void>; // 从后端同步用户信息
}

import { usePositionStore } from './positionStore';
import { useStakingStore } from './stakingStore';
import { useRiskControlStore } from './riskControlStore';

export const useAuthStore = create<AuthState>((set, get) => ({
  isLogin: false,
  token: null,
  user: null,
  isHydrated: false,

  // 登录
  login: async (email: string, password: string) => {
    try {
      // 优先使用 API 验证
      const result = await authApi.login({ email, password });

      if (result.success && result.user) {
        const user = result.user;

        // 更新 Zustand 状态
        set({
          isLogin: true,
          token: authApi.getToken(),
          user,
        });

        // 初始化资产
        useAssetStore.getState().initWithUser(user);

        // 登录成功后，同步后端数据
        usePositionStore.getState().syncFromBackend();
        usePositionStore.getState().syncPendingOrders();
        useAssetStore.getState().syncFromBackend();

        console.log(`[AuthStore] User logged in via API: ${user.id} (${user.email}, type: ${user.accountType})`);
      } else {
        // API 验证失败，尝试使用 Mock 数据
        const mockUser = validateUser(email, password);
        if (!mockUser) {
          throw new Error(result.error || 'Invalid email or password');
        }

        const user = {
          id: mockUser.id,
          username: email.split('@')[0],
          email: mockUser.email,
          balance: mockUser.balance,
          accountType: mockUser.accountType,
          createdAt: mockUser.createdAt,
        };

        // 生成模拟 token（统一格式：token_<userId>_<timestamp>）
        const token = `token_${user.id}_${Date.now()}`;

        // 保存到 localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // 同步 cookie
        if (typeof document !== 'undefined') {
          document.cookie = `token=${token}; path=/; max-age=86400; SameSite=lax`;
        }

        // 更新 Zustand 状态
        set({
          isLogin: true,
          token,
          user,
        });

        // 初始化资产
        useAssetStore.getState().initWithUser(user);

        // 登录成功后，同步后端数据
        usePositionStore.getState().syncFromBackend();
        usePositionStore.getState().syncPendingOrders();
        useAssetStore.getState().syncFromBackend();

        console.log(`[AuthStore] User logged in via Mock: ${user.id} (${user.email}, type: ${user.accountType})`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed');
    }
  },

  // 登出
  logout: async () => {
    console.log('[AuthStore] Starting logout process...');

    try {
      // 调用 API 登出（清除本地存储）
      await authApi.logout();
      console.log('[AuthStore] API logout completed');
    } catch (error) {
      console.warn('[AuthStore] Logout API failed:', error);
    }

    // 清除 localStorage 中的认证信息
    if (typeof window !== 'undefined') {
      console.log('[AuthStore] Clearing localStorage...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // 清除 cookie
      console.log('[AuthStore] Clearing cookies...');
      document.cookie = 'token=; path=/; max-age=0; SameSite=lax';
    }

    // 重置所有业务 Store
    // 必须在清除登录态前重置，防止组件渲染时访问空数据
    console.log('[AuthStore] Resetting all stores...');
    useAssetStore.getState().init();
    usePositionStore.getState().clearPositions();
    useStakingStore.getState().reset();
    useRiskControlStore.getState().reset();

    set({
      isLogin: false,
      token: null,
      user: null,
      isHydrated: true,
    });

    console.log('[AuthStore] User logged out and stores reset');
  },

  // 注册
  register: async (email: string, password: string, accountType: AccountType = 'demo') => {
    try {
      // 优先使用 API 注册
      const result = await authApi.register({ email, password, accountType });

      if (result.success && result.userId) {
        console.log(`[AuthStore] User registered via API: ${result.userId} (${email}, type: ${accountType})`);
        return { userId: result.userId };
      }

      // API 注册失败，使用 Mock 数据
      const initialBalance = accountType === 'demo' ? 100000 : 0;
      const mockUser = createUser(email, password, accountType, initialBalance);

      console.log(`[AuthStore] User registered via Mock: ${mockUser.id} (${mockUser.email}, type: ${mockUser.accountType})`);

      // 暂时跳过同步到后端，避免502错误
      console.log('[AuthStore] Skipping backend sync for now');

      return { userId: mockUser.id };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Registration failed');
    }
  },

  // 从 localStorage 恢复登录状态
  hydrateFromCookie: () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);

        // 同步 cookie
        document.cookie = `token=${token}; path=/; max-age=86400; SameSite=lax`;

        set({
          isLogin: true,
          token,
          user,
        });

        // 初始化资产
        useAssetStore.getState().initWithUser(user);

        console.log(`[AuthStore] User restored from storage: ${user.id}`);
      } catch (error) {
        // JSON 解析失败，清除无效数据
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        console.error('[AuthStore] Failed to parse user from storage:', error);
      }
    }

    // 标记为已 hydrate
    set({ isHydrated: true });
  },

  // 从后端同步用户信息（用于刷新余额等）
  syncFromBackend: async () => {
    const { user } = get();
    if (!user) return;

    try {
      // 尝试从后端获取最新用户信息
      const response = await fetch(`/api/user/${user.id}`);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          const updatedUser = {
            ...user,
            balance: data.user.balance || user.balance,
          };

          // 更新状态
          set({ user: updatedUser });

          // 更新资产
          useAssetStore.getState().initWithUser(updatedUser);

          console.log(`[AuthStore] User synced from backend: ${user.id}, new balance: ${updatedUser.balance}`);
        }
      }
    } catch (error) {
      console.warn('[AuthStore] Failed to sync user from backend:', error);
      // 不影响用户体验，静默失败
    }
  },

  // 兼容旧代码的方法
  setLogin: (token: string, user: User) =>
    set({
      isLogin: true,
      token,
      user,
    }),
  setLogout: () =>
    set({
      isLogin: false,
      token: null,
      user: null,
    }),
}));
