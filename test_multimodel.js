// 多模型融合测试
require('dotenv').config();

const apiKey = process.env.DASHSCOPE_API_KEY;
const QwenAPI = require('./backend/services/qwen-api');

async function testMultiModel() {
  const qwenAPI = new QwenAPI(apiKey);
  
  try {
    console.log('🚀 测试多模型融合调用...\n');
    
    const result = await qwenAPI.callMultiModelAPI(
      '请解释冒泡排序算法，并提供Python实现',
      ''
    );
    
    console.log('✅ 多模型调用结果:');
    console.log('\n📋 主回答:');
    console.log(result.mainAnswer);
    
    console.log('\n🔍 深度分析:');
    console.log(result.deepAnalysis);
    
    console.log('\n💻 代码解决方案:');
    console.log(result.codeSolution);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testMultiModel();