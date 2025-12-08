const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();
const port = 3000;
const cors = require('cors')
const route_connect = require('./src/routes/connect-me');
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

app.get('/', (req, res) => {
  const nowdate = new Date();
  res.json({
    code: '200',
    success: true,
    message: '连接成功',
    date: nowdate.toLocaleString(),
  })
})

app.use('/api', route_connect);
connectMongoDB();
app.listen(port, () => { console.log("服务器已启动！访问：http://localhost:3000") });