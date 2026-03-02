'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '../../../components/auth-guard';
import { PageShell } from '../../../components/layout/page-shell';
import { useAuthStore } from '../../../stores/authStore';
import { toast } from 'sonner';

export default function VerifyPage() {
  const router = useRouter();
  const { user, isHydrated } = useAuthStore();
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [realName, setRealName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'front') {
          setFrontImage(reader.result as string);
        } else {
          setBackImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!realName || !idNumber) {
      toast.error('請完整填寫所有信息');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'verification',
          realName: realName.trim(),
          idCard: idNumber.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('實名認證已提交，等待審核通過');
        router.back();
      } else {
        toast.error(data.error || '提交失敗');
      }
    } catch (err) {
      console.error('Verification error:', err);
      toast.error('網絡錯誤，請稍後重試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell loading={!isHydrated}>
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">實名認證</h1>
              <p className="text-sm text-gray-500 mb-6">請完成實名認證以提升賬戶安全性和交易額度</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 身份证正面上传 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    身份證正面照片
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'front')}
                      className="hidden"
                      id="front-upload"
                    />
                    <label
                      htmlFor="front-upload"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      {frontImage ? (
                        <img
                          src={frontImage}
                          alt="身份证正面"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <>
                          <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-500">點擊上傳正面照片</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* 身份证反面上传 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    身份證反面照片
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'back')}
                      className="hidden"
                      id="back-upload"
                    />
                    <label
                      htmlFor="back-upload"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      {backImage ? (
                        <img
                          src={backImage}
                          alt="身份证反面"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : (
                        <>
                          <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-500">點擊上傳反面照片</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* 真实姓名 */}
                <div>
                  <label htmlFor="realName" className="block text-sm font-medium text-gray-700 mb-2">
                    真實姓名
                  </label>
                  <input
                    id="realName"
                    type="text"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder="請輸入真實姓名"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* 身份证号码 */}
                <div>
                  <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    身份證號碼
                  </label>
                  <input
                    id="idNumber"
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="請輸入身份證號碼"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* 提交按钮 */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? '提交中...' : '提交認證'}
                </button>
              </form>

              {/* 提示信息 */}
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-yellow-800 mb-1">注意事項</h3>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      <li>• 請上傳清晰、完整的身份證照片</li>
                      <li>• 信息必須與身份證一致</li>
                      <li>• 認證審核通常需要 1-3 個工作日</li>
                      <li>• 認證通過後無法修改</li>
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
