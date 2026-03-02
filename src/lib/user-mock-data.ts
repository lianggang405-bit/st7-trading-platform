/**
 * 用户 Mock 数据管理
 *
 * 职责：
 * 1. 管理用户 ID 分配（从 600151 开始，递增）
 * 2. 模拟用户存储（使用 localStorage）
 * 3. 提供用户查询和创建功能
 */

import type { AccountType } from '../stores/authStore';

export interface MockUser {
  id: string;           // 用户 ID（600151+）
  email: string;        // 邮箱
  password: string;     // 密码（明文，仅用于模拟）
  createdAt: string;    // 创建时间
  balance: number;      // 初始余额
  accountType: AccountType; // 账户类型：demo 或 real
}

/**
 * 用户存储键名
 */
const USERS_KEY = 'mock_users';
const NEXT_USER_ID_KEY = 'mock_next_user_id';

/**
 * 获取所有用户
 */
export function getAllUsers(): MockUser[] {
  if (typeof window === 'undefined') return [];

  const usersStr = localStorage.getItem(USERS_KEY);
  if (!usersStr) return [];

  try {
    return JSON.parse(usersStr);
  } catch (error) {
    console.error('[UserMock] Failed to parse users:', error);
    return [];
  }
}

/**
 * 保存用户列表
 */
function saveUsers(users: MockUser[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/**
 * 获取下一个用户 ID
 */
export function getNextUserId(): string {
  if (typeof window === 'undefined') return '600151';

  // 从 localStorage 获取下一个 ID
  const nextIdStr = localStorage.getItem(NEXT_USER_ID_KEY);
  let nextId: number;

  if (nextIdStr) {
    nextId = parseInt(nextIdStr, 10);
  } else {
    // 首次使用，从 600151 开始
    nextId = 600151;
    localStorage.setItem(NEXT_USER_ID_KEY, nextId.toString());
  }

  const idStr = nextId.toString();

  // 递增并保存
  localStorage.setItem(NEXT_USER_ID_KEY, (nextId + 1).toString());

  return idStr;
}

/**
 * 查找用户（通过邮箱）
 */
export function findUserByEmail(email: string): MockUser | null {
  const users = getAllUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * 查找用户（通过 ID）
 */
export function findUserById(id: string): MockUser | null {
  const users = getAllUsers();
  return users.find((u) => u.id === id) || null;
}

/**
 * 创建用户
 */
export function createUser(
  email: string,
  password: string,
  accountType: AccountType = 'demo',
  initialBalance?: number
): MockUser {
  const id = getNextUserId();

  // 根据账户类型设置初始余额
  const balance = initialBalance ?? (accountType === 'demo' ? 100000 : 0);

  const newUser: MockUser = {
    id,
    email,
    password,
    createdAt: new Date().toISOString(),
    balance,
    accountType,
  };

  const users = getAllUsers();
  users.push(newUser);
  saveUsers(users);

  console.log(`[UserMock] Created user: ${id} (${email}, type: ${accountType}, balance: ${balance})`);

  return newUser;
}

/**
 * 验证用户登录
 */
export function validateUser(email: string, password: string): MockUser | null {
  const user = findUserByEmail(email);
  if (!user) return null;

  if (user.password === password) {
    return user;
  }

  return null;
}

/**
 * 重置用户数据（用于测试）
 */
export function resetUserData() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(NEXT_USER_ID_KEY);
  console.log('[UserMock] User data reset');
}
