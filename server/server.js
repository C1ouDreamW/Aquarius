const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); // 引入path模块处理路径
require('dotenv').config();
const app = express();
const port = 3000;
const cors = require('cors')
const route_connect = require('./src/routes/connect-me');
const route_shuashua = require('./src/routes/shuashua');
const route_auth = require('./src/routes/auth'); // 导入认证路由
const authenticateToken = require('./src/middleware/auth'); // 导入认证中间件
const MongoURI = process.env.MongoURI;

async function connectMongoDB() {
  try {
    await mongoose.connect(MongoURI);
    console.log('数据库连接成功~');
  } catch (err) {
    console.log('数据库连接失败，', err);
    process.exit(1);
  }
}


app.use(cors());
app.use(express.json());

// 托管静态文件
// __dirname 是当前 server.js 所在的目录
app.use(express.static(path.join(__dirname, '../client')));

// 首页路由
app.get('/', (req, res) => {
  res.redirect('/main-page/index.html');
});

// 测试路由
app.get('/api/test-connect', (req, res) => {
  const nowdate = new Date();
  res.json({
    code: '200',
    success: true,
    message: '连接成功',
    date: nowdate.toLocaleString(),
  })
})

// 认证路由
app.use('/api/auth', route_auth);

// connect路由
app.use('/api', authenticateToken, route_connect);

// shuashuashua路由
app.use('/api/shuashua', authenticateToken, route_shuashua);

connectMongoDB();
app.listen(port, () => { console.log("服务器已启动！访问：http://localhost:3000") });