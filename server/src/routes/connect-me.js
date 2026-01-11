const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Connect_me = require('../models/Schema_connect_me')

router.use(express.json());

router.get('/test', (req, res) => {
  res.send("连接成功！")
})

router.post('/submit', async (req, res) => {
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

// 获取所有connect-me数据，支持搜索功能
router.get('/connect-me', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    // 如果有搜索参数，添加到查询条件
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // 查询数据，按日期倒序排列
    const data = await Connect_me.find(query).sort({ date: -1 });

    res.json({
      success: true,
      code: 200,
      data: data,
      message: "数据获取成功"
    });
  } catch (err) {
    console.error("获取数据发生错误：", err);
    res.status(500).json({
      success: false,
      code: 500,
      message: "数据获取失败"
    });
  }
});

module.exports = router;