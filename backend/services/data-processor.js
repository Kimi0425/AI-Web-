const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class DataProcessor {
  constructor() {}
  
  // 解析CSV文件
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }
  
  // 解析Markdown文件
  async parseMarkdown(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      // 简单的Markdown解析，提取标题和段落
      const lines = content.split('\n');
      const parsedContent = {
        titles: [],
        paragraphs: [],
        tables: []
      };
      
      let currentParagraph = '';
      for (const line of lines) {
        // 检查标题
        if (line.startsWith('#')) {
          if (currentParagraph) {
            parsedContent.paragraphs.push(currentParagraph.trim());
            currentParagraph = '';
          }
          parsedContent.titles.push(line);
        } 
        // 检查表格（简单识别）
        else if (line.includes('|')) {
          if (currentParagraph) {
            parsedContent.paragraphs.push(currentParagraph.trim());
            currentParagraph = '';
          }
          parsedContent.tables.push(line);
        }
        // 检查空行
        else if (line.trim() === '') {
          if (currentParagraph) {
            parsedContent.paragraphs.push(currentParagraph.trim());
            currentParagraph = '';
          }
        }
        // 其他内容添加到段落
        else {
          currentParagraph += line + ' ';
        }
      }
      
      // 添加最后一个段落
      if (currentParagraph) {
        parsedContent.paragraphs.push(currentParagraph.trim());
      }
      
      return parsedContent;
    } catch (error) {
      console.error('解析Markdown文件时出错:', error);
      throw error;
    }
  }
  
  // 保存处理后的数据到知识库
  async saveToKnowledgeBase(userId, fileName, content, fileType) {
    const knowledgeBasePath = path.join(__dirname, '../../knowledge_base', userId);
    
    // 创建用户知识库目录
    if (!fs.existsSync(knowledgeBasePath)) {
      fs.mkdirSync(knowledgeBasePath, { recursive: true });
    }
    
    // 保存数据内容
    const filePath = path.join(knowledgeBasePath, `${fileName}.json`);
    const dataToSave = {
      fileName: fileName,
      fileType: fileType,
      content: content,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2));
    
    return filePath;
  }
  
  // 获取用户数据文件列表
  getUserDataFiles(userId) {
    const knowledgeBasePath = path.join(__dirname, '../../knowledge_base', userId);
    
    if (!fs.existsSync(knowledgeBasePath)) {
      return [];
    }
    
    const files = fs.readdirSync(knowledgeBasePath);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(knowledgeBasePath, file);
        const stats = fs.statSync(filePath);
        return {
          fileName: path.parse(file).name,
          modified: stats.mtime.toISOString(),
          size: stats.size
        };
      });
  }
  
  // 获取特定数据文件的内容
  getDataFileContent(userId, fileName) {
    const knowledgeBasePath = path.join(__dirname, '../../knowledge_base', userId);
    const filePath = path.join(knowledgeBasePath, `${fileName}.json`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  }
}

module.exports = DataProcessor;