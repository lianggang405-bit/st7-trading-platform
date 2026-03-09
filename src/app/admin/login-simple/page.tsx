'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SimpleLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', data.token);
        }
        alert('登录成功');
        router.push('/admin');
      } else {
        alert(data.error || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '448px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '24px'
      }}>
        <div style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '8px'
          }}>
            简化版登录页面
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            纯 HTML 标签，不使用 UI 组件库
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="email" style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              邮箱
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                height: '36px',
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="password" style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              密码
            </label>
            <input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{
                height: '36px',
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              height: '36px',
              width: '100%',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: loading ? '#9ca3af' : '#2563eb',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            <strong>调试信息：</strong>
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            如果能看到这个页面，说明问题出在 UI 组件库（Radix UI）上。
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            请尝试登录，看是否能正常跳转。
          </p>
        </div>
      </div>
    </div>
  );
}
