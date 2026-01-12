import jwt from 'jsonwebtoken';

/**
 * JWT认证中间件
 * @param {Object} req - Express请求对象
 * @param {Object} res - Express响应对象
 * @param {Function} next - Express下一个中间件函数
 */
const authenticateToken = (req, res, next) => {
  // 从Authorization头获取令牌
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // 如果没有令牌，返回401未授权
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未授权访问，请先登录',
      code: 401
    });
  }

  // 验证令牌
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    // 如果令牌无效，返回403禁止访问
    if (err) {
      return res.status(403).json({
        success: false,
        message: '令牌无效或已过期',
        code: 403
      });
    }

    // 将用户信息存储到请求对象中
    req.user = user;
    next();
  });
};

export default authenticateToken;