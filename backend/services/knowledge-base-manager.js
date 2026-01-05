// 知识库管理模块
const fs = require('fs');
const path = require('path');

class KnowledgeBaseManager {
  constructor(basePath) {
    this.basePath = basePath;
  }
  
  // 获取用户知识库路径
  getUserKnowledgeBasePath(userId) {
    return path.join(this.basePath, userId);
  }
  
  // 创建用户知识库
  createUserKnowledgeBase(userId) {
    const userPath = this.getUserKnowledgeBasePath(userId);
    if (!fs.existsSync(userPath)) {
      fs.mkdirSync(userPath, { recursive: true });
    }
    return userPath;
  }
  
  // 保存文献到知识库
  saveLiterature(userId, fileName, content) {
    const userPath = this.createUserKnowledgeBase(userId);
    const filePath = path.join(userPath, `${fileName}.txt`);
    fs.writeFileSync(filePath, content);
    return filePath;
  }
  
  // 获取用户所有文献
  getUserLiteratures(userId) {
    const userPath = this.getUserKnowledgeBasePath(userId);
    if (!fs.existsSync(userPath)) {
      return [];
    }
    
    const files = fs.readdirSync(userPath);
    return files.map(file => {
      const filePath = path.join(userPath, file);
      const stats = fs.statSync(filePath);
      return {
        fileName: path.parse(file).name,
        filePath: filePath,
        size: stats.size,
        modified: stats.mtime
      };
    }).sort((a, b) => b.modified - a.modified); // 按修改时间倒序排列
  }
  
  // 获取文献内容
  getLiteratureContent(userId, fileName) {
    const userPath = this.getUserKnowledgeBasePath(userId);
    const filePath = path.join(userPath, `${fileName}.txt`);
    
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    
    return null;
  }
  
  // 删除文献
  deleteLiterature(userId, fileName) {
    const userPath = this.getUserKnowledgeBasePath(userId);
    const filePath = path.join(userPath, `${fileName}.txt`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    
    return false;
  }
  
  // 永久保存用户问答记录
  saveUserQaRecord(userId, question, answer, references = []) {
    const userPath = this.createUserKnowledgeBase(userId);
    const qaFilePath = path.join(userPath, 'qa_history.json');
    
    // 读取现有的问答记录
    let qaHistory = [];
    if (fs.existsSync(qaFilePath)) {
      const content = fs.readFileSync(qaFilePath, 'utf8');
      qaHistory = JSON.parse(content);
    }
    
    // 添加新的问答记录
    qaHistory.push({
      question: question,
      answer: answer,
      references: references,
      timestamp: new Date().toISOString()
    });
    
    // 保存到文件（保留最近100条记录）
    const recentHistory = qaHistory.slice(-100);
    fs.writeFileSync(qaFilePath, JSON.stringify(recentHistory, null, 2));
    
    return recentHistory;
  }
  
  // 获取用户问答历史
  getUserQaHistory(userId) {
    const userPath = this.getUserKnowledgeBasePath(userId);
    const qaFilePath = path.join(userPath, 'qa_history.json');
    
    if (fs.existsSync(qaFilePath)) {
      const content = fs.readFileSync(qaFilePath, 'utf8');
      return JSON.parse(content);
    }
    
    return [];
  }
}

module.exports = KnowledgeBaseManager;