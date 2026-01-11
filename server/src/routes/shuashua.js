const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const authenticateToken = require('../middleware/auth');

// 初始化 Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 错误处理
const handleResponse = (res, { data, error }) => {
  if (error) {
    console.error('Supabase Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
  res.json({ success: true, data });
};

// -- 公开接口
// 获取所有类别
router.get('/categories', async (req, res) => {
  const result = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });
  handleResponse(res, result);
});

// 获取题目
router.get('/questions', async (req, res) => {
  const { category } = req.query;
  let query = supabase.from('questions').select('*');

  if (category) {
    query = query.eq('category', category);
  }

  // 默认按时间倒序
  const result = await query.order('created_at', { ascending: false });
  handleResponse(res, result);
});

// -- 管理员接口
// 管理员登录
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const email = `${username}@cloud.qwq`;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return res.status(401).json({ success: false, message: error.message });
  res.json({ success: true, session: data.session });
});

// 创建类别
router.post('/categories', authenticateToken, async (req, res) => {
  const result = await supabase.from('categories').insert([req.body]).select();
  handleResponse(res, result);
});

// 删除类别
router.delete('/categories/:id', authenticateToken, async (req, res) => {
  const result = await supabase.from('categories').delete().eq('id', req.params.id);
  handleResponse(res, result);
});

// 创建题目
router.post('/questions', authenticateToken, async (req, res) => {
  const result = await supabase.from('questions').insert([req.body]).select();
  handleResponse(res, result);
});

// 删除题目
router.delete('/questions/:id', authenticateToken, async (req, res) => {
  const result = await supabase.from('questions').delete().eq('id', req.params.id);
  handleResponse(res, result);
});

module.exports = router;