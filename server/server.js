import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import route_connect from './src/routes/connect-me.js';
import route_shuashua from './src/routes/shuashua.js';
import route_auth from './src/routes/auth.js';
import authenticateToken from './src/middleware/auth.js';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;
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

// shuashuashua路由
// 公开接口 - 不需要认证
app.use('/api/shuashua', route_shuashua);

// connect路由 - 公开接口，不需要认证
app.use('/api/connect', route_connect);

connectMongoDB();
app.listen(port, () => { console.log("服务器已启动！访问：http://localhost:3000") });