const express = require('express');
const app = express();
const post = 3000;
const cors = require('cors')

app.use(cors());
app.use(express.json())

app.get('/', (req, res) => {
  const nowdate = new Date()
  res.json({
    code: '200',
    success: true,
    message: '连接成功',
    date: nowdate.toLocaleString,
  })
})

app.listen(post, () => { console.log("服务器已启动！访问：http://localhost:3000") });