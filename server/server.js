const express = require('express');
const app = express();
const post = 3000;

app.get('/', (req, res) => {
  res.send("你好~后端服务器运行成功")
})

app.listen(post, () => { console.log("服务器已启动！访问：http://localhost:3000") });