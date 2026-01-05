const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const UsersStore = require('../services/users-store');
const usersStore = new UsersStore();

const router = express.Router();

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 检查用户是否已存在
    const existingUser = await usersStore.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建新用户
    const user = await usersStore.create({ username, password: hashedPassword });

    // 为用户创建独立目录（知识库与上传）
    const baseKbPath = path.join(__dirname, '../../knowledge_base', user._id);
    const baseUploadPath = path.join(__dirname, '../../uploads', user._id);
    if (!fs.existsSync(baseKbPath)) fs.mkdirSync(baseKbPath, { recursive: true });
    if (!fs.existsSync(baseUploadPath)) fs.mkdirSync(baseUploadPath, { recursive: true });
    
    res.status(201).json({ message: '注册成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 查找用户
    const user = await usersStore.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: '用户不存在' });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: '密码错误' });
    }
    
    // 生成JWT令牌
    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ token, message: '登录成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
});

module.exports = router;