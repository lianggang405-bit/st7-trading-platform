/**
 * 模拟数据服务
 * 当数据库不可用时，使用 localStorage 存储模拟数据
 */

// Mock 用户数据
export interface MockUser {
  id: number;
  email: string;
  username: string;
  accountType: 'demo' | 'real';
  balance: string;
  creditScore: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock 申请数据
export interface MockApplication {
  id: number;
  userId: number;
  type: 'deposit' | 'withdraw' | 'verification';
  status: 'pending' | 'approved' | 'rejected';
  amount?: string;
  bankName?: string;
  bankAccount?: string;
  realName?: string;
  idCard?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  user?: MockUser;
}

// Mock 市场调控记录
export interface MockMarketAdjustment {
  id: number;
  action: 'rise' | 'fall' | 'flat';
  symbol: string;
  beforePrice: string;
  afterPrice: string;
  changePercent: string;
  createdBy: string;
  createdAt: string;
}

// 初始化模拟数据
const initMockData = () => {
  if (typeof window === 'undefined') return;

  const mockUsers: MockUser[] = [
    {
      id: 600151,
      email: 'demo@example.com',
      username: 'demo001',
      accountType: 'demo',
      balance: '100000.00',
      creditScore: 85,
      isVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 600152,
      email: 'demo2@example.com',
      username: 'demo002',
      accountType: 'demo',
      balance: '50000.00',
      creditScore: 90,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 600153,
      email: 'real@example.com',
      username: 'real001',
      accountType: 'real',
      balance: '12500.00',
      creditScore: 75,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockApplications: MockApplication[] = [
    {
      id: 1,
      userId: 600151,
      type: 'deposit',
      status: 'pending',
      amount: '1000.00',
      bankName: '中國銀行',
      bankAccount: '****1234',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
      user: mockUsers[0],
    },
    {
      id: 2,
      userId: 600152,
      type: 'withdraw',
      status: 'pending',
      amount: '500.00',
      bankName: '工商銀行',
      bankAccount: '****5678',
      createdAt: new Date(Date.now() - 43200000).toISOString(),
      updatedAt: new Date(Date.now() - 43200000).toISOString(),
      user: mockUsers[1],
    },
    {
      id: 3,
      userId: 600153,
      type: 'verification',
      status: 'pending',
      realName: '張三',
      idCard: '310***********1234',
      createdAt: new Date(Date.now() - 21600000).toISOString(),
      updatedAt: new Date(Date.now() - 21600000).toISOString(),
      user: mockUsers[2],
    },
  ];

  if (!localStorage.getItem('mock_users')) {
    localStorage.setItem('mock_users', JSON.stringify(mockUsers));
  }

  if (!localStorage.getItem('mock_applications')) {
    localStorage.setItem('mock_applications', JSON.stringify(mockApplications));
  }

  if (!localStorage.getItem('mock_market_adjustments')) {
    localStorage.setItem('mock_market_adjustments', JSON.stringify([]));
  }
};

// 获取用户列表
export const getMockUsers = (): MockUser[] => {
  if (typeof window === 'undefined') return [];

  const users = localStorage.getItem('mock_users');
  return users ? JSON.parse(users) : [];
};

// 更新用户
export const updateMockUser = (id: number, updates: Partial<MockUser>): MockUser | null => {
  if (typeof window === 'undefined') return null;

  const users = getMockUsers();
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) return null;

  const updatedUser = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
  users[index] = updatedUser;
  localStorage.setItem('mock_users', JSON.stringify(users));

  return updatedUser;
};

// 获取申请列表
export const getMockApplications = (): MockApplication[] => {
  if (typeof window === 'undefined') return [];

  const apps = localStorage.getItem('mock_applications');
  const users = getMockUsers();

  if (!apps) return [];

  const applications = JSON.parse(apps);
  // 关联用户信息
  return applications.map((app: MockApplication) => ({
    ...app,
    user: users.find((u) => u.id === app.userId),
  }));
};

// 更新申请
export const updateMockApplication = (id: number, updates: Partial<MockApplication>): MockApplication | null => {
  if (typeof window === 'undefined') return null;

  const apps = localStorage.getItem('mock_applications');
  if (!apps) return null;

  const applications = JSON.parse(apps);
  const index = applications.findIndex((a: MockApplication) => a.id === id);

  if (index === -1) return null;

  const updatedApp = {
    ...applications[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  applications[index] = updatedApp;
  localStorage.setItem('mock_applications', JSON.stringify(applications));

  return updatedApp;
};

// 获取市场调控记录
export const getMockMarketAdjustments = (): MockMarketAdjustment[] => {
  if (typeof window === 'undefined') return [];

  const adjustments = localStorage.getItem('mock_market_adjustments');
  return adjustments ? JSON.parse(adjustments) : [];
};

// 添加市场调控记录
export const addMockMarketAdjustment = (adjustment: Omit<MockMarketAdjustment, 'id' | 'createdAt'>): MockMarketAdjustment => {
  if (typeof window === 'undefined') {
    return { id: 0, ...adjustment, createdAt: new Date().toISOString() };
  }

  const adjustments = getMockMarketAdjustments();
  const newAdjustment = {
    id: adjustments.length + 1,
    ...adjustment,
    createdAt: new Date().toISOString(),
  };

  adjustments.unshift(newAdjustment);
  localStorage.setItem('mock_market_adjustments', JSON.stringify(adjustments));

  return newAdjustment;
};

// 初始化
if (typeof window !== 'undefined') {
  initMockData();
}
