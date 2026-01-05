// 简单的AI模型测试
require('dotenv').config();

const apiKey = process.env.DASHSCOPE_API_KEY;
console.log('🔍 测试API密钥:', apiKey ? '已配置' : '未配置');

// 测试QwenAPI
const QwenAPI = require('./backend/services/qwen-api');
const qwenAPI = new QwenAPI(apiKey);

async function testQwen() {
  try {
    console.log('\n🚀 测试QwenAPI...');
    
    // 测试主模型
    const mainResponse = await qwenAPI.callQwenAPI('请用一句话介绍Python语言的特点');
    console.log('✅ 主模型响应:', mainResponse);
    
    // 测试深度思考模型
    const thinkingResponse = await qwenAPI.callDeepThinkingAPI('请分析冒泡排序的优缺点');
    console.log('✅ 深度思考响应:', thinkingResponse);
    
    // 测试代码生成模型
    const codeResponse = await qwenAPI.callCodeGenerationAPI('请实现一个冒泡排序函数');
    console.log('✅ 代码生成响应:', codeResponse);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testQwen();