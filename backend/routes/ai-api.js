const express = require('express');
const axios = require('axios');
const router = express.Router();

// 通义大模型API配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

// 调用通义大模型API
router.post('/chat', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    // 构建请求参数
    const payload = {
      model: 'qwen-plus', // 或其他可用模型
      input: {
        prompt: prompt,
        context: context || []
      },
      parameters: {
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.8
      }
    };
    
    // 发送请求到通义大模型API
    const response = await axios.post(DASHSCOPE_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // 返回API响应
    res.json(response.data);
  } catch (error) {
    console.error('调用通义大模型API时出错:', error);
    res.status(500).json({ message: 'API调用失败' });
  }
});

module.exports = router;