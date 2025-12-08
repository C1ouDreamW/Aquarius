const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Connect_me = require('../models/Schema_connect_me')

router.use(express.json());

router.get('/test', (req, res) => {
  res.send("连接成功！")
})
router.post('/connect', async (req, res) => {
  console.log("接收：", req.body);

  if (req.body.name) {
    const submit = new Connect_me({
      name: req.body.name,
      email: req.body.email,
      message: req.body.message,
    })
    try {
      await submit.save();
      res.json({
        success: true,
        code: 200,
        message: "来自后端的问候~",
        date: new Date().toLocaleString(),
      })
    } catch (err) {
      console.log("保存数据发生错误：", err);
    }
  } else {
    res.send("没填写名字！");
  }

})

module.exports = router;