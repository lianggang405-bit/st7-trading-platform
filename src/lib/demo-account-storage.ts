/**
 * 模拟账户存储
 * 用于存储和管理模拟账户数据
 */

export interface DemoAccount {
  id: string;
  email: string;
  password: string;
  username: string;
  balance: number;
  accountType: 'demo' | 'real';
  createdAt: string;
}

// 模拟账户存储
const demoAccounts: Map<string, DemoAccount> = new Map();

/**
 * 根据邮箱查找账户
 */
export function findAccountByEmail(email: string): DemoAccount | null {
  for (const account of demoAccounts.values()) {
    if (account.email === email) {
      return account;
    }
  }
  return null;
}

/**
 * 添加账户
 */
export function addAccount(account: DemoAccount): void {
  demoAccounts.set(account.id, account);
}

/**
 * 创建模拟账户
 */
export function createDemoAccount(params: {
  id: string;
  email: string;
  password: string;
  username: string;
  balance: number;
  accountType: 'demo' | 'real';
}): DemoAccount {
  const account: DemoAccount = {
    id: params.id,
    email: params.email,
    password: params.password,
    username: params.username,
    balance: params.balance,
    accountType: params.accountType,
    createdAt: new Date().toISOString(),
  };
  
  addAccount(account);
  return account;
}

/**
 * 获取所有账户
 */
export function getAllAccounts(): DemoAccount[] {
  return Array.from(demoAccounts.values());
}

/**
 * 删除账户
 */
export function removeAccount(id: string): boolean {
  return demoAccounts.delete(id);
}

/**
 * 清空所有账户
 */
export function clearAllAccounts(): void {
  demoAccounts.clear();
}

/**
 * 更新账户余额
 */
export function updateAccountBalance(id: string, newBalance: number): boolean {
  const account = demoAccounts.get(id);
  if (account) {
    account.balance = newBalance;
    return true;
  }
  return false;
}
