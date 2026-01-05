// AI模型调用测试脚本
const QwenAPI = require('./backend/services/qwen-api');
const DashScopeAPI = require('./backend/services/dashscope-api');
const dotenv = require('dotenv');

dotenv.config();

async function testAIModels() {
  console.log('🧪 开始测试AI模型调用...\n');
  
  const apiKey = process.env.DASHSCOPE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ 错误: 未找到DASHSCOPE_API_KEY环境变量');
    return;
  }
  
  console.log('✅ API密钥已配置');
  
  // 测试QwenAPI
  console.log('\n🔍 测试QwenAPI...');
  const qwenAPI = new QwenAPI(apiKey);
  
  try {
    const testPrompt = "你好，请简单介绍一下冒泡排序算法。";
    console.log('📤 发送测试请求:', testPrompt);
    
    const response = await qwenAPI.callQwenAPI(testPrompt);
    console.log('✅ QwenAPI响应成功:', response);
    
  } catch (error) {
    console.error('❌ QwenAPI调用失败:', error.message);
  }
  
  // 测试DashScopeAPI
  console.log('\n🔍 测试DashScopeAPI...');
  const dashScopeAPI = new DashScopeAPI(apiKey);
  
  try {
    const testPrompt = "请用一句话介绍Python语言的特点。";
    console.log('📤 发送测试请求:', testPrompt);
    
    const response = await dashScopeAPI.generateText(testPrompt);
    console.log('✅ DashScopeAPI响应成功:', response);
    
  } catch (error) {
    console.error('❌ DashScopeAPI调用失败:', error.message);
  }
  
  console.log('\n🎯 测试完成！');
}

// 运行测试
if (require.main === module) {
  testAIModels();
}

module.exports = { testAIModels };