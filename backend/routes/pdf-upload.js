const express = require('express');
const multer = require('multer');
const path = require('path');
const PDFProcessor = require('../services/pdf-processor');
const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 按用户分目录保存
    const userId = (req.user && req.user.userId) ? req.user.userId : 'default-user';
    const uploadPath = path.join(__dirname, '../../uploads', userId);
    try {
      if (!require('fs').existsSync(uploadPath)) {
        require('fs').mkdirSync(uploadPath, { recursive: true });
      }
    } catch (e) {}
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// PDF文献上传接口（支持多文件）
router.post('/upload', upload.array('pdf', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '请选择PDF文件' });
    }
    
    // 检查文件类型
    for (let file of req.files) {
      if (file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: `文件 "${file.originalname}" 不是PDF格式` });
      }
    }
    
    // 处理所有PDF文件
    const pdfProcessor = new PDFProcessor();
    const userId = (req.user && req.user.userId) ? req.user.userId : 'default-user'; // 从认证中间件获取
    const results = [];
    
    for (let file of req.files) {
      try {
        // 处理PDF文件
        const textContent = await pdfProcessor.extractTextFromPDF(file.path);
        
        // 保存到知识库
        const fileName = path.parse(file.originalname).name;
        await pdfProcessor.saveToKnowledgeBase(userId, fileName, textContent);
        
        results.push({
          fileName: fileName,
          status: 'success',
          message: '处理成功'
        });
      } catch (fileError) {
        console.error('处理文件时出错:', fileError);
        results.push({
          fileName: file.originalname,
          status: 'error',
          message: '处理失败: ' + fileError.message
        });
      }
    }
    
    // 计算成功和失败的数量
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.length - successCount;
    
    let message = `成功处理 ${successCount} 个文件`;
    if (errorCount > 0) {
      message += `，${errorCount} 个文件处理失败`;
    }
    
    res.json({ 
      message: message,
      results: results
    });
  } catch (error) {
    console.error('处理PDF文件时出错:', error);
    res.status(500).json({ message: '文件处理失败: ' + error.message });
  }
});

module.exports = router;