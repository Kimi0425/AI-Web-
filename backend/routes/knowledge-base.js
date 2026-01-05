const express = require('express');
const KnowledgeBaseManager = require('../services/knowledge-base-manager');
const path = require('path');
const router = express.Router();

// 初始化知识库管理器
const knowledgeBaseManager = new KnowledgeBaseManager(
  path.join(__dirname, '../../knowledge_base')
);

// 获取用户知识库中的所有文献
router.get('/literatures', (req, res) => {
  try {
    const userId = req.user.userId; // 从认证中间件获取
    const literatures = knowledgeBaseManager.getUserLiteratures(userId);
    res.json(literatures);
  } catch (error) {
    console.error('获取文献列表时出错:', error);
    res.status(500).json({ message: '获取文献列表失败' });
  }
});

// 获取特定文献内容
router.get('/literatures/:fileName', (req, res) => {
  try {
    const userId = req.user.userId; // 从认证中间件获取
    const { fileName } = req.params;
    const content = knowledgeBaseManager.getLiteratureContent(userId, fileName);
    
    if (content) {
      res.json({ content: content });
    } else {
      res.status(404).json({ message: '文献不存在' });
    }
  } catch (error) {
    console.error('获取文献内容时出错:', error);
    res.status(500).json({ message: '获取文献内容失败' });
  }
});

// 删除文献
router.delete('/literatures/:fileName', (req, res) => {
  try {
    const userId = req.user.userId; // 从认证中间件获取
    const { fileName } = req.params;
    const success = knowledgeBaseManager.deleteLiterature(userId, fileName);
    
    if (success) {
      res.json({ message: '文献删除成功' });
    } else {
      res.status(404).json({ message: '文献不存在' });
    }
  } catch (error) {
    console.error('删除文献时出错:', error);
    res.status(500).json({ message: '删除文献失败' });
  }
});

module.exports = router;