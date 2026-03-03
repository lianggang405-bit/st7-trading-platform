import { NextRequest, NextResponse } from 'next/server';
import { mockDataService } from '@/lib/mock-data-service';

export async function GET(req: NextRequest) {
  try {
    // 从 cookie 获取 token
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 从 token 解析用户 ID (格式: token_<userId>_<timestamp>)
    const userIdMatch = token.match(/token_(\d+)_/);
    if (!userIdMatch) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = parseInt(userIdMatch[1]);

    // 使用模拟数据服务获取用户的申请列表
    // 注意：模拟数据服务返回所有申请，这里我们在内存中过滤
    const allApplications = mockDataService.getApplications();
    const userApplications = allApplications.filter((app: any) => app.userId === userId);

    return NextResponse.json({
      success: true,
      applications: userApplications,
    });
  } catch (error) {
    console.error('[Applications GET] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 从 cookie 获取 token
    const token = req.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 从 token 解析用户 ID (格式: token_<userId>_<timestamp>)
    const userIdMatch = token.match(/token_(\d+)_/);
    if (!userIdMatch) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = parseInt(userIdMatch[1]);

    // 检查是否是 FormData
    const contentType = req.headers.get('content-type') || '';
    let type, amount, bankName, bankAccount, proof;

    if (contentType.includes('multipart/form-data')) {
      // 处理 FormData（新入金页面）
      const formData = await req.formData();
      type = formData.get('type') as string;
      amount = formData.get('amount') as string;
      proof = formData.get('proof') as File;

      if (type === 'crypto') {
        // 数字货币充值
        const currencyId = formData.get('currencyId') as string;
        
        if (!currencyId || !amount || !proof) {
          return NextResponse.json({ error: 'Missing required fields for crypto deposit' }, { status: 400 });
        }

        // TODO: 保存文件到对象存储
        // 这里暂时只记录文件信息
        console.log('[Applications] Crypto deposit - Currency ID:', currencyId, 'Amount:', amount, 'File:', proof.name);

        // 创建数字货币充值申请
        const application = mockDataService.addApplication({
          userId,
          type: 'deposit',
          amount,
          bankName: 'Crypto',
          bankAccount: currencyId,
        });

        return NextResponse.json({ success: true, application });
      } else if (type === 'bank') {
        // 银行卡充值
        const bankId = formData.get('bankId') as string;
        
        if (!bankId || !amount || !proof) {
          return NextResponse.json({ error: 'Missing required fields for bank deposit' }, { status: 400 });
        }

        // TODO: 保存文件到对象存储
        // 这里暂时只记录文件信息
        console.log('[Applications] Bank deposit - Bank ID:', bankId, 'Amount:', amount, 'File:', proof.name);

        // 创建银行充值申请
        const application = mockDataService.addApplication({
          userId,
          type: 'deposit',
          amount,
          bankName: bankId,
          bankAccount: 'N/A',
        });

        return NextResponse.json({ success: true, application });
      } else {
        return NextResponse.json({ error: 'Invalid application type' }, { status: 400 });
      }
    } else {
      // 处理 JSON（旧入金页面和实名认证）
      const body = await req.json();
      type = body.type;
      amount = body.amount;
      bankName = body.bankName;
      bankAccount = body.bankAccount;

      // 验证申请类型
      if (!type || !['deposit', 'withdraw', 'verification'].includes(type)) {
        return NextResponse.json({ error: 'Invalid application type' }, { status: 400 });
      }

      // 根据类型验证必填字段
      if (type === 'deposit' || type === 'withdraw') {
        if (!amount || isNaN(parseFloat(amount))) {
          return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
        }
        if (!bankName || !bankAccount) {
          return NextResponse.json(
            { error: 'Bank name and account are required' },
            { status: 400 }
          );
        }
      }

      if (type === 'verification') {
        if (!body.realName || !body.idCard) {
          return NextResponse.json(
            { error: 'Real name and ID card are required for verification' },
            { status: 400 }
          );
        }
      }

      // 创建申请记录并保存到 MockDataService
      let application;

      if (type === 'verification') {
        // 实名认证申请
        application = mockDataService.addApplication({
          userId,
          type: 'verification',
          realName: body.realName,
          idCard: body.idCard,
        });
      } else {
        // 入金/出金申请
        application = mockDataService.addApplication({
          userId,
          type,
          amount,
          bankName,
          bankAccount,
        });
      }

      console.log('[Applications] Created application:', application);

      return NextResponse.json({
        success: true,
        application,
      });
    }
  } catch (error) {
    console.error('[Applications POST] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
