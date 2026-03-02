#!/usr/bin/env python3
"""
修复 Supabase 环境变量检查的脚本
移除不必要的 NEXT_PUBLIC_SUPABASE 检查，直接使用 getSupabaseClient()
"""

import os
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent
API_DIR = PROJECT_ROOT / 'src' / 'app' / 'api' / 'admin'

def fix_file(file_path):
    """修复单个文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # 移除环境变量检查
        # const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        # const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        # const useSupabase = supabaseUrl && supabaseServiceKey;
        content = re.sub(
            r'// 检查Supabase环境变量是否配置\s*\nconst supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL;\s*\nconst supabaseServiceKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY;\s*\nconst useSupabase = supabaseUrl && supabaseServiceKey;\s*\n',
            '',
            content
        )

        content = re.sub(
            r'const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL;\s*\nconst supabaseServiceKey = process\.env\.SUPABASE_SERVICE_ROLE_KEY;\s*\nconst useSupabase = supabaseUrl && supabaseServiceKey;\s*\n',
            '',
            content
        )

        # 移除 useSupabase 检查
        # if (!useSupabase) { ... }
        content = re.sub(
            r'// 如果没有配置Supabase，直接返回模拟数据\s*\nif \(!useSupabase\) \{.*?return NextResponse\.json\(\{.*?\}, \{.*?\}\);\s*\}',
            '// 如果 Supabase 初始化失败，返回模拟数据\ntry {',
            content,
            flags=re.DOTALL
        )

        # 移除 try-catch 中的 createClient 导入，直接使用 getSupabaseClient
        content = re.sub(
            r'try \{\s*const \{ createClient \} = await import\([\'"]@supabase/supabase-js[\'"]\);\s*supabase = getSupabaseClient\(\);\s*\} catch',
            'try {\s*      supabase = getSupabaseClient();\s*    } catch',
            content
        )

        # 如果内容有变化，写回文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False

    except Exception as e:
        print(f"错误处理文件 {file_path}: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """主函数"""
    print("开始修复 Supabase 环境变量检查...")

    total_files = 0
    fixed_files = 0

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
