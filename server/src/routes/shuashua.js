import express from 'express';
import { Sequelize, DataTypes } from 'sequelize';
import authenticateToken from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// 初始化 SQLite 数据库
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './src/data/database.sqlite'
});

// 定义模型
const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => Math.random().toString(36).substr(2, 9)
  },
  name: DataTypes.STRING,
  icon: DataTypes.STRING,
  color: DataTypes.STRING,
  description: DataTypes.TEXT,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

const Chapter = sequelize.define('Chapter', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => Math.random().toString(36).substr(2, 9)
  },
  category: DataTypes.STRING,
  name: DataTypes.STRING,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => Math.random().toString(36).substr(2, 9)
  },
  category: DataTypes.STRING,
  chapter: DataTypes.STRING,
  text: DataTypes.TEXT,
  question: DataTypes.TEXT,
  type: DataTypes.STRING,
  options: DataTypes.JSON,
  answer: DataTypes.STRING,
  correct_option_ids: DataTypes.JSON,
  explanation: DataTypes.TEXT,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => Math.random().toString(36).substr(2, 9)
  },
  username: DataTypes.STRING,
  password: DataTypes.STRING,
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// 初始化数据库
async function initDatabase() {
  try {
    await sequelize.sync();
    console.log('SQLite database synchronized successfully');

  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// 启动时初始化数据库
initDatabase();

// 错误处理
const handleResponse = (res, data, error) => {
  if (error) {
    console.error('Database Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
  res.json({ success: true, data });
};

// -- 公开接口
// 获取所有类别
router.get('/categories', async (req, res) => {
  try {
    const data = await Category.findAll({ order: [['created_at', 'DESC']] });
    handleResponse(res, data, null);
  } catch (error) {
    handleResponse(res, null, error);
  }
});

// 获取章节
router.get('/chapters', async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category) {
      query.category = category;
    }
    const data = await Chapter.findAll({
      where: query,
      order: [['created_at', 'DESC']]
    });
    handleResponse(res, data, null);
  } catch (error) {
    handleResponse(res, null, error);
  }
});

// 获取题目
router.get('/questions', async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category) {
      query.category = category;
    }
    const data = await Question.findAll({
      where: query,
      order: [['created_at', 'DESC']]
    });
    // 转换数据结构以匹配前端期望
    const formattedData = data.map(item => ({
      id: item.id,
      category: item.category,
      chapter: item.chapter,
      text: item.text || item.question,
      question: item.question,
      type: item.type || 'SINGLE_CHOICE',
      options: item.options,
      answer: item.answer,
      correct_option_ids: item.correct_option_ids || (item.answer ? [item.answer] : []),
      explanation: item.explanation,
      created_at: item.created_at,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
    handleResponse(res, formattedData, null);
  } catch (error) {
    handleResponse(res, null, error);
  }
});

// -- 管理员接口

// 管理员登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ success: true, token });
  } catch (error) {
    handleResponse(res, null, error);
  }
});

// 创建类别
router.post('/categories', authenticateToken, async (req, res) => {
  try {
    const categoryData = {
      id: req.body.id || Math.random().toString(36).substr(2, 9),
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
      description: req.body.description,
      created_at: req.body.created_at || new Date().toISOString()
    };
    const data = await Category.create(categoryData);
    handleResponse(res, data, null);
  } catch (error) {
    handleResponse(res, null, error);
  }
});

// 删除类别
router.delete('/categories/:id', authenticateToken, async (req, res) => {
  try {
    const data = await Category.destroy({ where: { id: req.params.id } });
    handleResponse(res, data, null);
  } catch (error) {
    handleResponse(res, null, error);
  }
});

// 创建题目
router.post('/questions', authenticateToken, async (req, res) => {
  try {
    // 处理前端提交的数据结构
    const questionData = {
      id: req.body.id || Math.random().toString(36).substr(2, 9),
      category: req.body.category,
      chapter: req.body.chapter,
      text: req.body.text,
      question: req.body.text, // 保持兼容性
      type: req.body.type,
      options: req.body.options,
      answer: Array.isArray(req.body.correct_option_ids) ? req.body.correct_option_ids[0] : req.body.correct_option_ids,
      correct_option_ids: req.body.correct_option_ids,
      explanation: req.body.explanation,
      created_at: req.body.created_at || new Date().toISOString()
    };
    const data = await Question.create(questionData);
    // 返回格式化的数据结构
    const formattedData = {
      id: data.id,
      category: data.category,
      chapter: data.chapter,
      text: data.text || data.question,
      question: data.question,
      type: data.type || 'SINGLE_CHOICE',
      options: data.options,
      answer: data.answer,
      correct_option_ids: data.correct_option_ids || (data.answer ? [data.answer] : []),
      explanation: data.explanation,
      created_at: data.created_at,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
    handleResponse(res, formattedData, null);
  } catch (error) {
    handleResponse(res, null, error);
  }
});

// 删除题目
router.delete('/questions/:id', authenticateToken, async (req, res) => {
  try {
    const data = await Question.destroy({ where: { id: req.params.id } });
    handleResponse(res, data, null);
  } catch (error) {
    handleResponse(res, null, error);
  }
});

// 创建章节
router.post('/chapters', authenticateToken, async (req, res) => {
  try {
    const data = await Chapter.create(req.body);
    handleResponse(res, data, null);
  } catch (error) {
    handleResponse(res, null, error);
  }
});

// 删除章节
router.delete('/chapters/:id', authenticateToken, async (req, res) => {
  try {
    const data = await Chapter.destroy({ where: { id: req.params.id } });
    handleResponse(res, data, null);
  } catch (error) {
    handleResponse(res, null, error);
  }
});

export default router;