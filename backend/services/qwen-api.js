// 通义千问API服务
const axios = require('axios');

class QwenAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    // 默认API URL和模型
    this.defaultApiUrl = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
    this.compatibleModeApiUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  }
  
  // 主模型 (qwen-plus) - 用于综合问答
  async callQwenAPI(prompt) {
    return this.callModelAPI('qwen-plus', prompt, this.defaultApiUrl);
  }
  
  // 代码生成模型 (qwen-plus) - 用于代码生成
  async callCodeGenerationAPI(prompt) {
    return this.callModelAPI('qwen-plus', prompt, this.defaultApiUrl);
  }

  // 深度思考模型 (qwen-plus) - 用于复杂分析
  async callDeepThinkingAPI(prompt) {
    return this.callModelAPI('qwen-plus', prompt, this.defaultApiUrl);
  }
  
  // 通用模型调用方法
  async callModelAPI(model, prompt, apiUrl) {
    try {
      // 根据API URL选择正确的请求格式
      const isCompatibleMode = apiUrl.includes('compatible-mode');
      
      let requestData, headers;
      
      if (isCompatibleMode) {
        // OpenAI兼容模式
        requestData = {
          model: model,
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7,
          top_p: 0.8,
          stream: false
        };
        
        headers = {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
      } else {
        // 标准DashScope API
        requestData = {
          model: model,
          input: {
            prompt: prompt
          },
          parameters: {
            max_tokens: 1500,
            temperature: 0.7,
            top_p: 0.8,
            result_format: "message"
          }
        };
        
        headers = {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        };
      }
      
      const response = await axios.post(apiUrl, requestData, { 
        headers,
        timeout: 60000 // 60秒超时，给模型更多时间
      });
      
      // 记录响应数据用于调试
      console.log(`模型 ${model} 调用成功`);
      
      // 处理不同格式的响应
      if (response.data && response.data.output && response.data.output.text) {
        return response.data.output.text;
      } else if (response.data && response.data.output && response.data.output.choices) {
        return response.data.output.choices[0].message.content;
      } else if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        // OpenAI兼容模式的响应格式
        return response.data.choices[0].message.content;
      } else {
        console.error(`模型 ${model} 的响应格式:`, response.data);
        return "抱歉，无法获取有效的响应内容。";
      }
    } catch (error) {
      console.error(`调用${model}模型时出错:`, error.response?.data || error.message);
      
      // 提供更详细的错误信息
      if (error.response?.status === 401) {
        return "API密钥无效或已过期，请检查配置。";
      } else if (error.response?.status === 429) {
        return "API调用频率过高，请稍后再试。";
      } else if (error.response?.status === 500) {
        return "服务器内部错误，请稍后重试。";
      } else {
        return "抱歉，当前无法连接到AI服务，请检查网络连接或稍后重试。";
      }
    }
  }
  
  // 多模型融合调用
  async callMultiModelAPI(question, knowledgeBaseContent) {
    try {
      console.log('🔍 开始多模型融合调用...');
      
      // 1. 使用深度思考模型进行问题分析
      const thinkingPrompt = `请对以下问题进行深度分析，提供详细的思考过程：

问题: ${question}

请按照以下格式进行深度分析：

## 🔍 问题分析
[分析问题的核心和关键点]

## 📚 所需知识
[解决此问题需要的知识领域]

## 🎯 解决方案路径
[可能的解决方法和步骤]

## 💡 关键洞察
[重要的发现和洞察]

请确保分析深入且具体。`;
      
      let thinkingResponse = '';
      try {
        thinkingResponse = await this.callDeepThinkingAPI(thinkingPrompt);
        console.log('✅ 深度分析完成');
      } catch (error) {
        console.error('深度分析模型调用失败:', error);
        thinkingResponse = '抱歉，深度分析暂时无法进行。';
      }
      
      // 2. 使用主模型基于知识库回答问题
      let mainPrompt = "你是一个专业的科研助手，请基于提供的文献资料回答用户的问题。";
      
      if (knowledgeBaseContent && knowledgeBaseContent.trim()) {
        mainPrompt += `\n\n## 📖 相关文献\n${knowledgeBaseContent}`;
      } else {
        mainPrompt += "\n\n请基于你的知识回答问题。";
      }
      
      mainPrompt += `\n\n## ❓ 用户问题\n${question}\n\n## 📋 回答要求\n- 提供详细且准确的回答\n- 如有引用文献，请明确标注[文献名]\n- 结构清晰，易于理解`;
      
      let mainResponse = '';
      try {
        mainResponse = await this.callQwenAPI(mainPrompt);
        console.log('✅ 主回答完成');
      } catch (error) {
        console.error('主模型调用失败:', error);
        mainResponse = '抱歉，暂时无法获取回答。';
      }
      
      // 3. 如果问题涉及代码，使用代码生成模型
      let codeResponse = '';
      if (this.isCodeRelatedQuestion(question)) {
        const codePrompt = `请为以下问题生成完整的代码解决方案：

问题: ${question}

## 💻 代码要求
- 提供完整的可运行代码
- 包含必要的注释和说明
- 使用最佳实践
- 考虑边界情况和错误处理

## 📋 代码格式
请包含：
1. 函数/类定义
2. 使用示例
3. 必要的解释

请直接提供代码实现。`;
        
        try {
          codeResponse = await this.callCodeGenerationAPI(codePrompt);
          console.log('✅ 代码生成完成');
        } catch (error) {
          console.error('代码生成模型调用失败:', error);
          codeResponse = '抱歉，代码生成暂时无法进行。';
        }
      }
      
      // 4. 融合三个模型的输出并格式化
      const result = {
        mainAnswer: this.formatAnswer(mainResponse || '抱歉，暂时无法获取回答。', 'main'),
        deepAnalysis: this.formatAnswer(thinkingResponse || '抱歉，深度分析暂时无法进行。', 'deepAnalysis'),
        codeSolution: this.formatAnswer(codeResponse || '', 'code'),
        references: []
      };
      
      console.log('✅ 多模型融合调用完成');
      return result;
      
    } catch (error) {
      console.error('多模型调用时出错:', error);
      return {
        mainAnswer: '抱歉，AI服务暂时不可用，请稍后重试。',
        deepAnalysis: '抱歉，深度分析暂时无法进行。',
        codeSolution: null,
        references: []
      };
    }
  }
  
  // 判断问题是否与代码相关
  isCodeRelatedQuestion(question) {
    const codeKeywords = ['代码', '编程', '函数', '算法', '实现', '程序', '脚本', '开发', '写一个', '如何写', '怎么写', 'code', 'program', 'script'];
    return codeKeywords.some(keyword => question.includes(keyword));
  }
  
  // 格式化回答，使其更清晰易读
  formatAnswer(answer, type = 'main') {
    let formattedAnswer = answer;
    
    // 根据回答类型进行格式化
    if (type === 'deepAnalysis') {
      // 深度分析格式化
      formattedAnswer = formattedAnswer
        .replace(/## 🔍 问题分析/g, '\n\n## 🔍 问题分析\n')
        .replace(/## 📚 所需知识/g, '\n\n## 📚 所需知识\n')
        .replace(/## 🎯 解决方案路径/g, '\n\n## 🎯 解决方案路径\n')
        .replace(/## 💡 关键洞察/g, '\n\n## 💡 关键洞察\n')
        .replace(/### ✅/g, '\n### ✅')
        .replace(/### 📌/g, '\n### 📌')
        .replace(/### 🧠/g, '\n### 🧠')
        .replace(/---/g, '\n---\n');
    } else if (type === 'code') {
      // 代码解决方案格式化
      formattedAnswer = formattedAnswer
        .replace(/```python/g, '\n```python\n')
        .replace(/```/g, '\n```\n')
        .replace(/### ✅/g, '\n### ✅')
        .replace(/### 📌/g, '\n### 📌')
        .replace(/### 🧠/g, '\n### 🧠')
        .replace(/---/g, '\n---\n');
    } else {
      // 主回答格式化
      formattedAnswer = formattedAnswer
        .replace(/### ✅/g, '\n### ✅')
        .replace(/### 📌/g, '\n### 📌')
        .replace(/### 🧠/g, '\n### 🧠')
        .replace(/---/g, '\n---\n')
        .replace(/\n{3,}/g, '\n\n'); // 减少多余的空行
    }
    
    return formattedAnswer.trim();
  }

  // 为回答添加适当的表情符号
  addEmojisToAnswer(answer) {
    // 定义关键词和对应的表情符号
    const emojiMap = {
      // 积极情绪
      '成功': '✅',
      '正确': '✅',
      '好': '👍',
      '棒': '👍',
      '优秀': '🌟',
      '完美': '💯',
      '完成': '✅',
      '解决': '✅',
      
      // 消极情绪
      '错误': '❌',
      '失败': '❌',
      '问题': '❓',
      '困难': '⚠️',
      '警告': '⚠️',
      '注意': '⚠️',
      
      // 学术相关
      '研究': '🔬',
      '数据': '📊',
      '图表': '📈',
      '实验': '🧪',
      '结论': '💡',
      '发现': '🔍',
      
      // 时间相关
      '现在': '⏰',
      '今天': '📅',
      '明天': '📅',
      '昨天': '📅',
      
      // 情感表达
      '高兴': '😊',
      '开心': '😊',
      '满意': '😊',
      '感谢': '🙏',
      '谢谢': '🙏',
      '帮助': '🤝',
      
      // 其他常用
      '重要': '❗',
      '特别': '❗',
      '记住': '📝',
      '笔记': '📝',
      '思考': '🤔',
      '想法': '💭'
    };
    
    // 添加表情符号到回答中
    let result = answer;
    for (const [keyword, emoji] of Object.entries(emojiMap)) {
      const regex = new RegExp(keyword, 'gi');
      result = result.replace(regex, `${emoji} ${keyword}`);
    }
    
    return result;
  }
  
  // 提取回答中的文献引用
  extractReferences(answer, literatureList) {
    // 查找回答中提及的文献名
    const referencedLiteratures = literatureList.filter(literature => {
      // 检查文献名是否在回答中被提及（不区分大小写）
      const literatureName = literature.fileName.toLowerCase();
      const answerText = answer.toLowerCase();
      return answerText.includes(literatureName);
    });
    
    return referencedLiteratures.map(lit => lit.fileName);
  }
}

module.exports = QwenAPI;