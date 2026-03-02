#!/usr/bin/env python3
"""
修复 Supabase 客户端导入的脚本
将所有使用错误环境变量的 API 文件修复为使用统一的 getSupabaseClient()
"""

import os
import re
from pathlib import Path

# 项目根目录
PROJECT_ROOT = Path(__file__).parent
API_DIR = PROJECT_ROOT / 'src' / 'app' / 'api' / 'admin'

def fix_file(file_path):
    """修复单个文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 检查文件是否使用了错误的环境变量
        if 'NEXT_PUBLIC_SUPABASE' not in content and 'SUPABASE_SERVICE_ROLE_KEY' not in content:
            return False

        original_content = content

        # 模式1: 直接创建客户端
        # const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        # const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        # const supabase = createClient(supabaseUrl, supabaseKey);

        # 替换环境变量定义
        content = re.sub(
            r'const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL\s*\|\|\s*\'\';\s*\n',
            '',
            content
        )
        content = re.sub(
            r'const supabaseKey = process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY\s*\|\|\s*\'\';\s*\n',
            '',
            content
        )
        content = re.sub(
            r'const supabaseUrl = process\.env\.COZE_SUPABASE_URL\s*\|\|\s*\'\';\s*\n',
            '',
            content
        )
        content = re.sub(
            r'const supabaseKey = process\.env\.COZE_SUPABASE_ANON_KEY\s*\|\|\s*\'\';\s*\n',
            '',
            content
        )

        # 替换 service role key
        content = re.sub(
            r'const supabaseServiceKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY!\s*;\s*\n',
            '',
            content
        )

        # 替换 createClient 调用
        content = re.sub(
            r'const supabase = createClient\([^)]+\);\s*\n',
            'const supabase = getSupabaseClient();\n',
            content
        )
        content = re.sub(
            r'supabase = createClient\([^)]+\);\s*\n',
            'supabase = getSupabaseClient();\n',
            content
        )

        # 替换导入
        content = re.sub(
            r"import \{ createClient \} from ['\"]@supabase/supabase-js['\"];\s*\n",
            "import { getSupabaseClient } from '@/storage/database/supabase-client';\n",
            content
        )

        # 如果文件导入了 supabase-client，移除重复导入
        if 'from \'@/storage/database/supabase-client\'' in content:
            content = re.sub(
                r"import \{ getSupabaseClient \} from ['\"]@/storage/database/supabase-client['\"];\s*\n",
                '',
                content
            )

        # 确保有正确的导入
        if 'getSupabaseClient' in content and 'from \'@/storage/database/supabase-client\'' not in content:
            # 在文件开头添加导入
            import_pattern = r"(import.*?;\n)+"
            match = re.search(import_pattern, content)
            if match:
                # 检查是否已经有正确的导入
                if 'getSupabaseClient' not in match.group(0):
                    # 在最后一个 import 后添加
                    last_import_end = match.end()
                    content = content[:last_import_end] + "import { getSupabaseClient } from '@/storage/database/supabase-client';\n" + content[last_import_end:]

        # 如果内容有变化，写回文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False

    except Exception as e:
        print(f"错误处理文件 {file_path}: {e}")
        return False

def main():
    """主函数"""
    print("开始修复 Supabase 客户端导入...")

    # 统计
    total_files = 0
    fixed_files = 0

    # 遍历所有 API 文件
    for file_path in API_DIR.rglob('*.ts'):
        if file_path.is_file():
            total_files += 1
            if fix_file(file_path):
                fixed_files += 1
                print(f"✓ 已修复: {file_path.relative_to(PROJECT_ROOT)}")

    print(f"\n完成！")
    print(f"总计检查文件: {total_files}")
    print(f"已修复文件: {fixed_files}")

if __name__ == '__main__':
    main()
