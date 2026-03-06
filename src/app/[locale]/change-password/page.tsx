'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '../../../components/auth-guard';
import { PageShell } from '../../../components/layout/page-shell';
import { useAuthStore } from '../../../stores/authStore';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { score: 0, text: '', color: '' };
    if (password.length < 6) return { score: 1, text: '弱', color: 'text-red-500' };
    if (password.length < 10) return { score: 2, text: '中', color: 'text-yellow-500' };
    return { score: 3, text: '強', color: 'text-green-500' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证当前密码
    if (!currentPassword) {
      setError('請輸入當前密碼');
      return;
    }

    // 验证新密码
    if (!newPassword) {
      setError('請輸入新密碼');
      return;
    }

    if (newPassword.length < 6) {
      setError('新密碼長度至少為 6 位');
      return;
    }

    // 验证确认密码
    if (!confirmPassword) {
      setError('請確認新密碼');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('兩次輸入的新密碼不一致');
      return;
    }

    // 验证新密码不能与当前密码相同
    if (currentPassword === newPassword) {
      setError('新密碼不能與當前密碼相同');
      return;
    }

    setIsSubmitting(true);

    // 模擬提交
    setTimeout(() => {
      setIsSubmitting(false);
      alert('密碼修改成功，請重新登錄');
      router.push('/login');
    }, 1500);
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <PageShell loading={false}>
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 pb-20">
          {/* 顶部导航 */}
          <div className="bg-white shadow-sm">
            <div className="px-4 py-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-lg font-medium">返回</span>
              </button>
            </div>
          </div>

          {/* 主要内容 */}
          <div className="px-4 py-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">修改密碼</h1>
              <p className="text-sm text-gray-500 mb-6">為了您的賬戶安全，請定期更換密碼</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 当前密码 */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    當前密碼
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="請輸入當前密碼"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* 新密码 */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    新密碼
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="請輸入新密碼（至少 6 位）"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {newPassword && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-500">密碼強度：</span>
                      <span className={`text-xs font-semibold ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                  )}
                </div>

                {/* 确认新密码 */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    確認新密碼
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="請再次輸入新密碼"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="mt-2 text-xs text-red-500">兩次輸入的密碼不一致</p>
                  )}
                </div>

                {/* 错误提示 */}
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* 提交按钮 */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? '提交中...' : '確認修改'}
                </button>
              </form>

              {/* 提示信息 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">密碼安全建議</h3>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• 使用至少 6 位字符的密碼</li>
                      <li>• 建議使用字母、數字和特殊字符的組合</li>
                      <li>• 不要使用與其他網站相同的密碼</li>
                      <li>• 定期更換密碼以保護賬戶安全</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    </PageShell>
  );
}
