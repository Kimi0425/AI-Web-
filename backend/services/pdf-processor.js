const pdfjsLib = require('pdfjs-dist');
const fs = require('fs');
const path = require('path');

class PDFProcessor {
  constructor() {
    // 设置PDF.js worker路径
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.js';
  }
  
  // 提取PDF文本内容
  async extractTextFromPDF(filePath) {
    try {
      const data = new Uint8Array(fs.readFileSync(filePath));
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      
      let textContent = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map(item => item.str).join(' ') + '\n';
      }
      
      return textContent;
    } catch (error) {
      console.error('处理PDF文件时出错:', error);
      throw error;
    }
  }
  
  // 保存处理后的文献到知识库
  async saveToKnowledgeBase(userId, fileName, content) {
    const knowledgeBasePath = path.join(__dirname, '../../knowledge_base', userId);
    
    // 创建用户知识库目录
    if (!fs.existsSync(knowledgeBasePath)) {
      fs.mkdirSync(knowledgeBasePath, { recursive: true });
    }
    
    // 保存文献内容
    const filePath = path.join(knowledgeBasePath, `${fileName}.txt`);
    fs.writeFileSync(filePath, content);
    
    return filePath;
  }
}

module.exports = PDFProcessor;