const express = require('express');
const router = express.Router();
const QwenAPI = require('../services/qwen-api');
const KnowledgeBaseManager = require('../services/knowledge-base-manager');
const path = require('path');

// 初始化服务
const qwenAPI = new QwenAPI(process.env.DASHSCOPE_API_KEY);
const knowledgeBaseManager = new KnowledgeBaseManager(
  path.join(__dirname, '../../knowledge_base')
);

// 基于知识库的问答接口（多模型融合）
router.post('/ask', async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.user?.userId || "default-user"; // 从认证中间件获取或使用默认值
    
    if (!question) {
      return res.status(400).json({ message: '请输入问题' });
    }
    
    // 获取用户知识库中的所有文献内容
    const literatures = knowledgeBaseManager.getUserLiteratures(userId);
    let knowledgeBaseContent = "";
    
    if (literatures.length > 0) {
      knowledgeBaseContent = "以下是我提供的文献资料:\n\n";
      for (const literature of literatures) {
        const content = knowledgeBaseManager.getLiteratureContent(userId, literature.fileName);
        if (content) {
          knowledgeBaseContent += `文献: ${literature.fileName}\n${content.substring(0, 2000)}\n\n`; // 限制内容长度
        }
      }
    }
    
    // 调用多模型API
    const multiModelResponse = await qwenAPI.callMultiModelAPI(question, knowledgeBaseContent);
    
    // 提取实际引用的文献
    const references = qwenAPI.extractReferences(multiModelResponse.mainAnswer, literatures);
    multiModelResponse.references = references;
    
    // 保存问答记录到用户知识库
    // 保存主要回答和深度分析
    let fullAnswer = multiModelResponse.mainAnswer;
    if (multiModelResponse.deepAnalysis) {
      fullAnswer += `\n\n[深度分析]: ${multiModelResponse.deepAnalysis}`;
    }
    if (multiModelResponse.codeSolution) {
      fullAnswer += `\n\n[代码解决方案]: ${multiModelResponse.codeSolution}`;
    }
    
    knowledgeBaseManager.saveUserQaRecord(userId, question, fullAnswer, references);
    
    res.json({
      answer: multiModelResponse.mainAnswer,
      analysis: multiModelResponse.deepAnalysis,
      code: multiModelResponse.codeSolution,
      references: multiModelResponse.references
    });
  } catch (error) {
    console.error('问答过程中出错:', error);
    res.status(500).json({ message: '问答失败: ' + error.message });
  }
});

// 基于特定文献的问答接口
router.post('/ask/:literatureName', async (req, res) => {
  try {
    const { question } = req.body;
    const { literatureName } = req.params;
    const userId = req.user?.userId || "default-user"; // 从认证中间件获取或使用默认值
    
    if (!question) {
      return res.status(400).json({ message: '请输入问题' });
    }
    
    // 获取特定文献内容
    const literatureContent = knowledgeBaseManager.getLiteratureContent(userId, literatureName);
    
    if (!literatureContent) {
      return res.status(404).json({ message: '文献不存在' });
    }
    
    // 构造提示词，要求AI明确标识引用的文献
    const prompt = `你是一个专业的科研助手，请基于以下文献资料回答用户的问题。如果资料中没有相关信息，请如实说明。
    
文献: ${literatureName}
${literatureContent.substring(0, 3000)} // 限制内容长度

用户问题: ${question}

请提供详细的回答，并在回答中明确标识引用的文献来源，格式为[文献名]。`;
    
    // 调用通义千问API
    const answer = await qwenAPI.callQwenAPI(prompt);
    
    // 对于特定文献的问答，引用就是该文献
    const references = [literatureName];
    
    // 保存问答记录到用户知识库
    knowledgeBaseManager.saveUserQaRecord(userId, question, answer, references);
    
    res.json({
      answer: answer,
      references: references
    });
  } catch (error) {
    console.error('问答过程中出错:', error);
    res.status(500).json({ message: '问答失败: ' + error.message });
  }
});

// 获取用户问答历史
router.get('/history', (req, res) => {
  try {
    const userId = req.user?.userId || "default-user";
    const history = knowledgeBaseManager.getUserQaHistory(userId);
    res.json(history);
  } catch (error) {
    console.error('获取问答历史时出错:', error);
    res.status(500).json({ message: '获取问答历史失败' });
  }
});

module.exports = router;