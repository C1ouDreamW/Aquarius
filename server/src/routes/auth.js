import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

/**
 * 管理员登录路由
 * @route POST /api/auth/login
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 从环境变量获取管理员凭证
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // 验证用户名和密码
  if (username === adminUsername && password === adminPassword) {
    // 创建JWT令牌，有效期为1小时
    const token = jwt.sign(
      { username: adminUsername, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 返回成功响应和令牌
    res.json({
      success: true,
      message: '登录成功',
      token: token,
      user: {
        username: adminUsername,
        role: 'admin'
      }
    });
  } else {
    // 返回失败响应
    res.status(401).json({
      success: false,
      message: '用户名或密码错误',
      code: 401
    });
  }
});

/**
 * 验证令牌有效性
 * @route GET /api/auth/verify
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 */
router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未授权访问',
      code: 401
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '令牌无效或已过期',
        code: 403
      });
    }

    res.json({
      success: true,
      message: '令牌有效',
      user: user
    });
  });
});

export default router;