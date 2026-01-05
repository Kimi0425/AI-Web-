// 数据库连接配置
const mongoose = require('mongoose');

// 模拟数据库连接（暂时不实际连接MongoDB）
console.log('数据库连接已模拟');

// 模拟User模型
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// 模拟模型导出
const User = mongoose.model('User', userSchema);

module.exports = {
  connect: () => {
    console.log('数据库连接已模拟');
  },
  User: User
};