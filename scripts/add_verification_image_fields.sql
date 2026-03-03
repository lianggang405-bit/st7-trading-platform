-- ============================================
-- 添加实名认证图片字段
-- ============================================

-- 为 applications 表添加证件照图片字段
-- 使用 TEXT 类型存储 Base64 字符串

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS id_card_front_url TEXT,
ADD COLUMN IF NOT EXISTS id_card_back_url TEXT;

-- 添加注释
COMMENT ON COLUMN applications.id_card_front_url IS '身份证正面照片 (Base64 字符串，以 data:image/ 开头)';
COMMENT ON COLUMN applications.id_card_back_url IS '身份证反面照片 (Base64 字符串，以 data:image/ 开头)';

SELECT 'Added id_card_front_url and id_card_back_url fields to applications table' as status;
