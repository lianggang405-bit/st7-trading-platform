
CREATE TABLE IF NOT EXISTS info_management (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT,
  language TEXT,
  sort INTEGER DEFAULT 0,
  cover_image TEXT,
  is_show BOOLEAN DEFAULT true,
  keywords TEXT,
  summary TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO info_management (id, title, type, language, sort, cover_image, is_show, keywords)
VALUES (8, '公告', '公告', '中文简体', 1, '/images/info-cover-8.jpg', true, '公告')
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('info_management', 'id'), COALESCE(MAX(id), 1)) FROM info_management;
