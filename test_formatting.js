// 测试格式化回答功能
require('dotenv').config();

const apiKey = process.env.DASHSCOPE_API_KEY;
const QwenAPI = require('./backend/services/qwen-api');

async function testFormattedResponse() {
  const qwenAPI = new QwenAPI(apiKey);
  
  try {
    console.log('🚀 测试格式化回答功能...\n');
    
    const result = await qwenAPI.callMultiModelAPI(
      '请解释冒泡排序算法，并提供Python实现',
      ''
    );
    
    console.log('📋 格式化后的主回答:');
    console.log(result.mainAnswer);
    
    console.log('\n🔍 格式化后的深度分析:');
    console.log(result.deepAnalysis);
    
    console.log('\n💻 格式化后的代码解决方案:');
    console.log(result.codeSolution);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testFormattedResponse();