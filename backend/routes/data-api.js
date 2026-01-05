const express = require('express');
const multer = require('multer');
const path = require('path');
const DataProcessor = require('../services/data-processor');
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

// 数据文件上传接口（支持多文件）
router.post('/upload', upload.array('datafile', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '请选择数据文件' });
    }
    
    // 检查文件类型
    for (let file of req.files) {
      if (!file.originalname.endsWith('.csv') && !file.originalname.endsWith('.md')) {
        return res.status(400).json({ message: `文件 "${file.originalname}" 不是CSV或Markdown格式` });
      }
    }
    
    // 处理所有数据文件
    const dataProcessor = new DataProcessor();
    const userId = req.user.userId; // 从认证中间件获取
    const results = [];
    
    for (let file of req.files) {
      try {
        let content;
        const fileName = path.parse(file.originalname).name;
        let fileType;
        
        // 根据文件扩展名处理不同类型的文件
        if (file.originalname.endsWith('.csv')) {
          content = await dataProcessor.parseCSV(file.path);
          fileType = 'csv';
        } else if (file.originalname.endsWith('.md')) {
          content = await dataProcessor.parseMarkdown(file.path);
          fileType = 'markdown';
        }
        
        // 保存到知识库
        await dataProcessor.saveToKnowledgeBase(userId, fileName, content, fileType);
        
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
    console.error('处理数据文件时出错:', error);
    res.status(500).json({ message: '文件处理失败: ' + error.message });
  }
});

// 获取用户数据文件列表
router.get('/files', (req, res) => {
  try {
    const userId = req.user.userId;
    const dataProcessor = new DataProcessor();
    const files = dataProcessor.getUserDataFiles(userId);
    res.json(files);
  } catch (error) {
    console.error('获取数据文件列表时出错:', error);
    res.status(500).json({ message: '获取文件列表失败: ' + error.message });
  }
});

// 获取特定数据文件的内容
router.get('/files/:fileName', (req, res) => {
  try {
    const userId = req.user.userId;
    const { fileName } = req.params;
    const dataProcessor = new DataProcessor();
    const content = dataProcessor.getDataFileContent(userId, fileName);
    
    if (!content) {
      return res.status(404).json({ message: '文件不存在' });
    }
    
    res.json(content);
  } catch (error) {
    console.error('获取数据文件内容时出错:', error);
    res.status(500).json({ message: '获取文件内容失败: ' + error.message });
  }
});

module.exports = router;