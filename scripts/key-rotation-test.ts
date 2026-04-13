/**
 * 密钥轮换演练脚本
 * 
 * 验证 JWT_*_SECRET 更换后旧 token 失效行为
 * 
 * 运行方式: npx tsx scripts/key-rotation-test.ts
 */

import * as jose from 'jose';

const OLD_USER_SECRET = 'c2FmZS11c2VyLWp3dC1zZWNyZXQta2V5LWZvci1hY2Nlc3M=';
const NEW_USER_SECRET = 'bmV3LXVzZXItand0LXNlY3JldC1rZXktZm9yLXJvdGF0aW9u';

async function testKeyRotation() {
  console.log('==========================================');
  console.log('JWT 密钥轮换演练');
  console.log('==========================================\n');

  // 1. 用旧密钥签发 token
  console.log('[Step 1] 用旧密钥签发 token...');
  const oldToken = await new jose.SignJWT({ sub: 'user_123', role: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(OLD_USER_SECRET));
  console.log(`Token: ${oldToken.substring(0, 50)}...\n`);

  // 2. 用旧密钥验签 - 应该成功
  console.log('[Step 2] 用旧密钥验签...');
  try {
    const { payload } = await jose.jwtVerify(oldToken, new TextEncoder().encode(OLD_USER_SECRET));
    console.log(`✅ 旧密钥验签成功: sub=${payload.sub}, role=${payload.role}\n`);
  } catch (e) {
    console.log(`❌ 旧密钥验签失败: ${e}\n`);
  }

  // 3. 模拟密钥轮换（使用新密钥）
  console.log('[Step 3] 模拟密钥轮换（使用新密钥）...');
  console.log(`旧密钥: ${OLD_USER_SECRET.substring(0, 20)}...`);
  console.log(`新密钥: ${NEW_USER_SECRET.substring(0, 20)}...\n`);

  // 4. 用新密钥验签旧 token - 应该失败
  console.log('[Step 4] 用新密钥验签旧 token...');
  try {
    const { payload } = await jose.jwtVerify(oldToken, new TextEncoder().encode(NEW_USER_SECRET));
    console.log(`❌ 新密钥不应验签成功（旧 token 仍有效）: sub=${payload.sub}\n`);
    process.exit(1);
  } catch (e: any) {
    if (e.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      console.log('✅ 新密钥验签失败（旧 token 已失效）- 符合预期\n');
    } else {
      console.log(`✅ 验签失败: ${e.code}\n`);
    }
  }

  // 5. 用新密钥签发新 token
  console.log('[Step 5] 用新密钥签发新 token...');
  const newToken = await new jose.SignJWT({ sub: 'user_123', role: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(NEW_USER_SECRET));
  console.log(`Token: ${newToken.substring(0, 50)}...\n`);

  // 6. 用新密钥验签新 token - 应该成功
  console.log('[Step 6] 用新密钥验签新 token...');
  try {
    const { payload } = await jose.jwtVerify(newToken, new TextEncoder().encode(NEW_USER_SECRET));
    console.log(`✅ 新密钥验签成功: sub=${payload.sub}, role=${payload.role}\n`);
  } catch (e) {
    console.log(`❌ 新密钥验签失败: ${e}\n`);
    process.exit(1);
  }

  console.log('==========================================');
  console.log('✅ 密钥轮换演练完成');
  console.log('==========================================');
  console.log('\n结论:');
  console.log('1. 旧密钥签发的 token 在轮换后失效 ✓');
  console.log('2. 新密钥可以签发和验签新 token ✓');
  console.log('3. 需要配合黑名单机制清除旧 token');
}

testKeyRotation().catch(console.error);
