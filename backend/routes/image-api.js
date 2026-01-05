const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// 图片上传接口（支持多文件）
router.post('/upload', upload.array('image', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '请选择图片文件' });
    }
    
    // 检查文件类型
    for (let file of req.files) {
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: `文件 "${file.originalname}" 不是图片格式` });
      }
    }
    
    // 处理所有图片文件
    const userId = req.user.userId; // 从认证中间件获取
    const results = [];
    
    // 创建用户图片目录
    const userImageDir = path.join(__dirname, '../../uploads/images', userId);
    if (!fs.existsSync(userImageDir)) {
      fs.mkdirSync(userImageDir, { recursive: true });
    }
    
    for (let file of req.files) {
      try {
        // 移动文件到用户图片目录
        const fileName = Date.now() + '-' + file.originalname;
        const targetPath = path.join(userImageDir, fileName);
        fs.renameSync(file.path, targetPath);
        
        results.push({
          fileName: fileName,
          status: 'success',
          message: '上传成功'
        });
      } catch (fileError) {
        console.error('处理文件时出错:', fileError);
        results.push({
          fileName: file.originalname,
          status: 'error',
          message: '上传失败: ' + fileError.message
        });
      }
    }
    
    // 计算成功和失败的数量
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.length - successCount;
    
    let message = `成功上传 ${successCount} 个图片`;
    if (errorCount > 0) {
      message += `，${errorCount} 个图片上传失败`;
    }
    
    res.json({ 
      message: message,
      results: results
    });
  } catch (error) {
    console.error('处理图片文件时出错:', error);
    res.status(500).json({ message: '文件处理失败: ' + error.message });
  }
});

// 获取用户图片列表
router.get('/list', (req, res) => {
  try {
    const userId = req.user.userId;
    const userImageDir = path.join(__dirname, '../../uploads/images', userId);
    
    if (!fs.existsSync(userImageDir)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(userImageDir);
    const imageFiles = files.map(file => {
      const filePath = path.join(userImageDir, file);
      const stats = fs.statSync(filePath);
      return {
        fileName: file,
        modified: stats.mtime.toISOString(),
        size: stats.size
      };
    });
    
    res.json(imageFiles);
  } catch (error) {
    console.error('获取图片列表时出错:', error);
    res.status(500).json({ message: '获取图片列表失败: ' + error.message });
  }
});

// 删除图片
router.delete('/delete/:fileName', (req, res) => {
  try {
    const userId = req.user.userId;
    const { fileName } = req.params;
    const userImageDir = path.join(__dirname, '../../uploads/images', userId);
    const filePath = path.join(userImageDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '图片不存在' });
    }
    
    fs.unlinkSync(filePath);
    res.json({ message: '图片删除成功' });
  } catch (error) {
    console.error('删除图片时出错:', error);
    res.status(500).json({ message: '删除图片失败: ' + error.message });
  }
});

// 获取图片预览
router.get('/preview/:fileName', (req, res) => {
  try {
    const userId = req.user.userId;
    const { fileName } = req.params;
    const userImageDir = path.join(__dirname, '../../uploads/images', userId);
    const filePath = path.join(userImageDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: '图片不存在' });
    }
    
    // 设置正确的Content-Type
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.gif') contentType = 'image/gif';
    
    res.setHeader('Content-Type', contentType);
    res.sendFile(filePath);
  } catch (error) {
    console.error('获取图片预览时出错:', error);
    res.status(500).json({ message: '获取图片预览失败: ' + error.message });
  }
});

module.exports = router;