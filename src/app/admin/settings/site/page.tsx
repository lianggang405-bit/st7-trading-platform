'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSettings {
  emailAccount: string;
  tokenPassword: string;
  port: string;
  host: string;
  sender: string;
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailAccount: '123312',
    tokenPassword: '123123',
    port: '465',
    host: '123232',
    sender: '【ST5演示站】'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/notification');
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings/notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('设置保存成功');
      } else {
        toast.error('设置保存失败');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('设置保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>桌面</span> / <span>设置</span> / <span className="text-white">站点设置</span>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">通知设置</CardTitle>
              <CardDescription className="text-gray-400 mt-1">
                配置系统邮件通知服务参数
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSettings}
              disabled={loading}
              className="border-slate-600 hover:bg-slate-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="emailAccount" className="text-gray-300">邮箱账号</Label>
              <Input
                id="emailAccount"
                value={settings.emailAccount}
                onChange={(e) => setSettings({ ...settings, emailAccount: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="请输入邮箱账号"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tokenPassword" className="text-gray-300">token密码</Label>
              <Input
                id="tokenPassword"
                type="password"
                value={settings.tokenPassword}
                onChange={(e) => setSettings({ ...settings, tokenPassword: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="请输入SMTP授权码"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="port" className="text-gray-300">端口</Label>
              <Input
                id="port"
                value={settings.port}
                onChange={(e) => setSettings({ ...settings, port: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="请输入SMTP端口"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="host" className="text-gray-300">host</Label>
              <Input
                id="host"
                value={settings.host}
                onChange={(e) => setSettings({ ...settings, host: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="请输入SMTP服务器地址"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sender" className="text-gray-300">发件人</Label>
              <Input
                id="sender"
                value={settings.sender}
                onChange={(e) => setSettings({ ...settings, sender: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="请输入发件人名称"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? '保存中...' : '保存设置'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
