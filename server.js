// 主服务文件
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3001;
const os = require('os');

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 基础跨域支持（允许他人通过共享链接访问注册/登录等接口）
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 简易限流（IP级别）：60 requests / 60s，用于多用户并发与防刷
const rateMap = new Map();
app.use((req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 60s
  const limit = 60; // 60 req/min
  const bucket = rateMap.get(key) || { ts: now, count: 0 };
  if (now - bucket.ts > windowMs) {
    bucket.ts = now;
    bucket.count = 1;
  } else {
    bucket.count += 1;
  }
  rateMap.set(key, bucket);
  if (bucket.count > limit) {
    return res.status(429).json({ message: '请求过于频繁，请稍后再试' });
  }
  next();
});

// JWT认证中间件
const authenticateToken = (req, res, next) => {
  // 从请求头获取token
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  // 如果没有token，检查查询参数
  if (!token) {
    const tokenFromQuery = req.query.token;
    if (tokenFromQuery) {
      token = tokenFromQuery;
    }
  }
  
  // 如果仍然没有token，返回错误
  if (!token) {
    return res.status(401).json({ message: '访问令牌缺失' });
  }
  
  // 验证token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '令牌无效' });
    }
    req.user = user;
    next();
  });
};

// 静态文件服务
app.use(express.static(path.join(__dirname, 'frontend')));

// API路由
app.use('/api/auth', require('./backend/routes/auth'));
app.use('/api/ai', require('./backend/routes/ai-api'));
app.use('/api/pdf', authenticateToken, require('./backend/routes/pdf-upload'));
app.use('/api/data', authenticateToken, require('./backend/routes/data-api'));
app.use('/api/image', authenticateToken, require('./backend/routes/image-api'));
app.use('/api/knowledge', authenticateToken, require('./backend/routes/knowledge-base'));
app.use('/api/qa', authenticateToken, require('./backend/routes/qa-api'));

// 主页路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

// 主应用页面路由
app.get('/main.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'main.html'));
});

// 启动服务器
function getLocalIPv4() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

app.listen(PORT, () => {
  const ip = getLocalIPv4();
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`本机访问:   http://localhost:${PORT}/login.html`);
  console.log(`局域网访问: http://${ip}:${PORT}/login.html`);
  console.log('将上面“局域网访问”链接分享给同一网络下的用户即可注册使用');
});