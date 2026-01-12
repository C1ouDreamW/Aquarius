#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# 将./json目录下的JSON题库文件导入到database.sqlite数据库中

import os
import json
import sqlite3
import uuid
from datetime import datetime

class JsonToSqliteImporter:
    def __init__(self):
        """初始化导入器"""
        self.json_dir = './json'
        self.db_path = 'database.sqlite'
        self.conn = None
        self.cursor = None
    
    def connect_db(self):
        """连接数据库"""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.cursor = self.conn.cursor()
            print(f"✅ 成功连接到数据库: {self.db_path}")
            return True
        except sqlite3.Error as e:
            print(f"❌ 数据库连接失败: {e}")
            return False
    
    def close_db(self):
        """关闭数据库连接"""
        if self.conn:
            self.conn.close()
            print("✅ 数据库连接已关闭")
    
    def ensure_category_exists(self, category_name):
        """确保类别存在，不存在则创建"""
        try:
            # 检查类别是否存在
            self.cursor.execute("SELECT id FROM Categories WHERE name = ?", (category_name,))
            result = self.cursor.fetchone()
            
            if result:
                category_id = result[0]
                print(f"ℹ️  类别 '{category_name}' 已存在，ID: {category_id}")
            else:
                # 创建新类别
                category_id = str(uuid.uuid4())
                now = datetime.now().isoformat()
                self.cursor.execute('''
                    INSERT INTO Categories (id, name, icon, color, description, created_at, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (category_id, category_name, '📚', '#4CAF50', f'{category_name}题库', now, now, now))
                self.conn.commit()
                print(f"✅ 创建新类别: '{category_name}'，ID: {category_id}")
            
            return category_id, category_name
        except sqlite3.Error as e:
            print(f"❌ 类别操作失败: {e}")
            return None
    
    def ensure_chapter_exists(self, category_id, chapter_name):
        """确保章节存在，不存在则创建"""
        try:
            # 检查章节是否存在
            self.cursor.execute("SELECT id FROM Chapters WHERE category = ? AND name = ?", (category_id, chapter_name))
            result = self.cursor.fetchone()
            
            if result:
                chapter_id = result[0]
                print(f"ℹ️  章节 '{chapter_name}' 已存在，ID: {chapter_id}")
            else:
                # 创建新章节
                chapter_id = str(uuid.uuid4())
                now = datetime.now().isoformat()
                self.cursor.execute('''
                    INSERT INTO Chapters (id, category, name, created_at, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (chapter_id, category_id, chapter_name, now, now, now))
                self.conn.commit()
                print(f"✅ 创建新章节: '{chapter_name}'，ID: {chapter_id}")
            
            return chapter_id, chapter_name
        except sqlite3.Error as e:
            print(f"❌ 章节操作失败: {e}")
            return None
    
    def import_questions(self, category_id, chapter_id, category_name, chapter_name, questions, filename):
        """导入题目到数据库"""
        total = len(questions)
        success_count = 0
        error_count = 0
        
        print(f"\n📝 开始导入题目，共 {total} 题")
        
        for idx, q in enumerate(questions, 1):
            try:
                # 生成题目ID
                question_id = str(uuid.uuid4())
                now = datetime.now().isoformat()
                
                # 处理题目数据
                question_type = q.get('type', 'single_choice')
                content = q.get('content', '')
                options = q.get('options', [])
                answer = q.get('answer', '')
                
                # 转换选项为JSON格式
                options_json = json.dumps(options, ensure_ascii=False)
                
                # 处理答案格式
                if isinstance(answer, list):
                    # 多选题
                    correct_option_ids = json.dumps(answer, ensure_ascii=False)
                    answer_str = ','.join(answer)
                else:
                    # 单选题
                    correct_option_ids = json.dumps([answer], ensure_ascii=False)
                    answer_str = answer
                
                # 插入题目
                self.cursor.execute('''
                    INSERT INTO Questions (id, category, chapter, text, question, type, options, answer, correct_option_ids, explanation, created_at, createdAt, updatedAt)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    question_id, category_name, chapter_name, content, content, 
                    question_type, options_json, answer_str, correct_option_ids, 
                    '', now, now, now
                ))
                
                success_count += 1
                if idx % 10 == 0:
                    print(f"🔄 已导入 {idx}/{total} 题")
                
            except Exception as e:
                error_count += 1
                print(f"❌ 导入第 {idx} 题失败: {e}")
                continue
        
        # 提交事务
        if success_count > 0:
            self.conn.commit()
        
        print(f"\n📊 导入完成: 成功 {success_count} 题，失败 {error_count} 题")
        return success_count
    
    def process_json_file(self, filepath, filename):
        """处理单个JSON文件"""
        print(f"\n{'='*60}")
        print(f"📁 处理文件: {filename}")
        print(f"{'='*60}")
        
        # 读取JSON文件
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                questions = json.load(f)
            
            if not isinstance(questions, list):
                print("❌ JSON文件格式错误：根节点必须是数组")
                return False
            
            print(f"✅ 成功读取文件，共 {len(questions)} 题")
            
        except FileNotFoundError:
            print(f"❌ 文件不存在: {filepath}")
            return False
        except json.JSONDecodeError as e:
            print(f"❌ JSON解析失败: {e}")
            return False
        except Exception as e:
            print(f"❌ 读取文件失败: {e}")
            return False
        
        # 获取用户输入的类别和章节
        category_name = input("请输入题目类别: ")
        if not category_name.strip():
            print("❌ 类别不能为空")
            return False
        
        chapter_name = input("请输入题目章节: ")
        if not chapter_name.strip():
            print("❌ 章节不能为空")
            return False
        
        # 确保类别存在
        category_result = self.ensure_category_exists(category_name)
        if not category_result:
            return False
        category_id, category_name = category_result
        
        # 确保章节存在
        chapter_result = self.ensure_chapter_exists(category_id, chapter_name)
        if not chapter_result:
            return False
        chapter_id, chapter_name = chapter_result
        
        # 导入题目
        success_count = self.import_questions(category_id, chapter_id, category_name, chapter_name, questions, filename)
        return success_count > 0
    
    def run(self):
        """运行导入流程"""
        print("🚀 JSON题库导入工具启动")
        print(f"📁 扫描目录: {self.json_dir}")
        print(f"🗃️  目标数据库: {self.db_path}")
        
        # 连接数据库
        if not self.connect_db():
            return
        
        try:
            # 扫描JSON文件
            json_files = []
            for filename in os.listdir(self.json_dir):
                if filename.endswith('.json'):
                    json_files.append(filename)
            
            if not json_files:
                print("❌ 未找到JSON文件")
                return
            
            print(f"\n✅ 找到 {len(json_files)} 个JSON文件:")
            for i, filename in enumerate(json_files, 1):
                print(f"   {i}. {filename}")
            
            # 按顺序处理每个文件
            for filename in json_files:
                filepath = os.path.join(self.json_dir, filename)
                self.process_json_file(filepath, filename)
                
                # 询问是否继续
                if filename != json_files[-1]:
                    continue_input = input("\n是否继续处理下一个文件？(y/n): ")
                    if continue_input.lower() != 'y':
                        print("🛑 用户取消操作")
                        break
            
            print("\n🎉 导入流程完成！")
            
        finally:
            # 关闭数据库连接
            self.close_db()

if __name__ == "__main__":
    importer = JsonToSqliteImporter()
    importer.run()