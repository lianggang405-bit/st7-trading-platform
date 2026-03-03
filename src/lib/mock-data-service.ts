/**
 * 服务端模拟数据服务
 * 在服务端使用内存存储，不依赖数据库
 */

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
}

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

// 内存存储
class MockDataService {
  private users: MockUser[] = [];
  private applications: MockApplication[] = [];
  private marketAdjustments: MockMarketAdjustment[] = [];
  private userIdCounter = 600151;
  private appIdCounter = 1;
  private marketIdCounter = 1;

  constructor() {
    this.init();
  }

  private init() {
    // 初始化模拟用户
    this.users = [
      {
        id: this.userIdCounter++,
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
        id: this.userIdCounter++,
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
        id: this.userIdCounter++,
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

    // 初始化模拟申请
    this.applications = [
      {
        id: this.appIdCounter++,
        userId: 600151,
        type: 'deposit',
        status: 'pending',
        amount: '1000.00',
        bankName: '中國銀行',
        bankAccount: '****1234',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: this.appIdCounter++,
        userId: 600152,
        type: 'withdraw',
        status: 'pending',
        amount: '500.00',
        bankName: '工商銀行',
        bankAccount: '****5678',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
        updatedAt: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: this.appIdCounter++,
        userId: 600153,
        type: 'verification',
        status: 'pending',
        realName: '張三',
        idCard: '310***********1234',
        createdAt: new Date(Date.now() - 21600000).toISOString(),
        updatedAt: new Date(Date.now() - 21600000).toISOString(),
      },
    ];

    console.log('[MockDataService] Initialized with mock data');
  }

  // 获取用户列表
  getUsers(accountType?: 'demo' | 'real'): MockUser[] {
    if (accountType) {
      return this.users.filter((u) => u.accountType === accountType);
    }
    return [...this.users];
  }

  // 获取用户
  getUserById(id: number): MockUser | null {
    return this.users.find((u) => u.id === id) || null;
  }

  // 更新用户余额
  updateUserBalance(id: number, balance: string, reason?: string): MockUser | null {
    const user = this.getUserById(id);
    if (!user) return null;

    user.balance = balance;
    user.updatedAt = new Date().toISOString();

    console.log(`[MockDataService] Updated user ${id} balance to ${balance}${reason ? ` (${reason})` : ''}`);

    return user;
  }

  // 更新用户信用分
  updateUserCreditScore(id: number, creditScore: number, reason: string): MockUser | null {
    const user = this.getUserById(id);
    if (!user) return null;

    user.creditScore = creditScore;
    user.updatedAt = new Date().toISOString();

    console.log(`[MockDataService] Updated user ${id} credit score to ${creditScore} (${reason})`);

    return user;
  }

  // 获取申请列表
  getApplications(status?: 'pending' | 'approved' | 'rejected', type?: 'deposit' | 'withdraw' | 'verification'): Array<MockApplication & { user: MockUser | undefined }> {
    let result = [...this.applications];

    if (status) {
      result = result.filter((a) => a.status === status);
    }

    if (type) {
      result = result.filter((a) => a.type === type);
    }

    // 按创建时间倒序
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 关联用户信息
    return result.map((app) => ({
      ...app,
      user: this.getUserById(app.userId) || undefined,
    }));
  }

  // 更新申请状态
  updateApplicationStatus(
    id: number,
    status: 'approved' | 'rejected',
    reviewedBy: string,
    rejectReason?: string
  ): MockApplication | null {
    const app = this.applications.find((a) => a.id === id);
    if (!app) return null;

    app.status = status;
    app.reviewedBy = reviewedBy;
    app.reviewedAt = new Date().toISOString();
    app.rejectReason = rejectReason;
    app.updatedAt = new Date().toISOString();

    console.log(`[MockDataService] Updated application ${id} to ${status}`);

    // 如果批准入金申请，更新用户余额
    if (status === 'approved' && app.type === 'deposit' && app.amount) {
      const user = this.getUserById(app.userId);
      if (user) {
        const currentBalance = parseFloat(user.balance);
        user.balance = (currentBalance + parseFloat(app.amount)).toFixed(2);
        user.updatedAt = new Date().toISOString();
        console.log(`[MockDataService] User ${app.userId} deposit of ${app.amount} approved`);
      }
    }

    // 如果批准提现申请，扣除用户余额
    if (status === 'approved' && app.type === 'withdraw' && app.amount) {
      const user = this.getUserById(app.userId);
      if (user) {
        const currentBalance = parseFloat(user.balance);
        user.balance = (currentBalance - parseFloat(app.amount)).toFixed(2);
        user.updatedAt = new Date().toISOString();
        console.log(`[MockDataService] User ${app.userId} withdraw of ${app.amount} approved`);
      }
    }

    // 如果批准实名认证申请，更新用户状态
    if (status === 'approved' && app.type === 'verification') {
      const user = this.getUserById(app.userId);
      if (user) {
        user.isVerified = true;
        user.updatedAt = new Date().toISOString();
        console.log(`[MockDataService] User ${app.userId} verification approved`);
      }
    }

    return app;
  }

  // 添加申请
  addApplication(application: Omit<MockApplication, 'id' | 'createdAt' | 'updatedAt' | 'status'>): MockApplication {
    const newApplication: MockApplication = {
      id: this.appIdCounter++,
      ...application,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.applications.unshift(newApplication);

    console.log(`[MockDataService] Added application: ${application.type} for user ${application.userId}`);

    return newApplication;
  }

  // 获取市场调控记录
  getMarketAdjustments(symbol?: string, limit: number = 50): MockMarketAdjustment[] {
    let result = [...this.marketAdjustments];

    if (symbol) {
      result = result.filter((a) => a.symbol === symbol);
    }

    // 按创建时间倒序
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result.slice(0, limit);
  }

  // 添加市场调控记录
  addMarketAdjustment(adjustment: Omit<MockMarketAdjustment, 'id' | 'createdAt'>): MockMarketAdjustment {
    const newAdjustment: MockMarketAdjustment = {
      id: this.marketIdCounter++,
      ...adjustment,
      createdAt: new Date().toISOString(),
    };

    this.marketAdjustments.unshift(newAdjustment);

    console.log(`[MockDataService] Added market adjustment: ${adjustment.action} ${adjustment.symbol}`);

    return newAdjustment;
  }

  // 获取统计信息
  getStats() {
    return {
      totalUsers: this.users.length,
      pendingApplications: this.applications.filter((a) => a.status === 'pending').length,
      totalBalance: this.users.reduce((sum, u) => sum + parseFloat(u.balance), 0),
      recentAdjustments: this.marketAdjustments.length,
    };
  }
}

// 导出单例
export const mockDataService = new MockDataService();
