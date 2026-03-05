-- =====================================================
-- Supabase Storage 配置脚本
-- 用途：创建入金凭证存储桶和相关权限策略
-- 使用方法：在 Supabase Dashboard -> SQL Editor 中执行
-- =====================================================

-- 1. 创建存储桶 (Storage Bucket)
-- 注意：需要先在 Dashboard 中手动创建存储桶，名称为 'deposit-proofs'
-- 或者使用以下命令创建（需要超级用户权限）

-- 创建存储桶的 SQL（如果支持）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deposit-proofs',
  'deposit-proofs',
  true,  -- 公开访问，允许前端直接显示图片
  5242880,  -- 5MB 文件大小限制
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. 创建权限策略 (Policies)

-- 2.1 允许所有人查看公开图片
CREATE POLICY "允许所有人查看公开图片"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'deposit-proofs');

-- 2.2 允许认证用户上传图片
CREATE POLICY "允许认证用户上传图片"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'deposit-proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]  -- 只能上传到以用户ID命名的文件夹
);

-- 2.3 允许用户更新自己的图片
CREATE POLICY "允许用户更新自己的图片"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'deposit-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'deposit-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2.4 允许用户删除自己的图片
CREATE POLICY "允许用户删除自己的图片"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'deposit-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =====================================================
-- 执行说明
-- =====================================================
-- 1. 登录 Supabase Dashboard
-- 2. 进入 SQL Editor
-- 3. 复制上面的 SQL 语句并执行
-- 4. 验证存储桶是否创建成功：
--    - 进入 Storage -> deposit-proofs
--    - 查看 Policies 标签页，应该能看到上面创建的 4 个策略
-- =====================================================
