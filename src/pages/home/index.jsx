import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToAI } from '../../api';
import './index.css';

const Home = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: '你好，我是AI助手，有什么可以帮助你的？', sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 调用 API 获取回复
  const fetchAIResponse = async (userMessage) => {
    setIsLoading(true);
    
    try {
      // 调用API模块发送消息
      const response = await sendMessageToAI(userMessage);
      
      // 从响应中提取 AI 回复内容
      const aiResponseText = response.choices[0].message.content;
      
      setMessages(prev => [
        ...prev, 
        { 
          id: prev.length + 2, 
          text: aiResponseText, 
          sender: 'ai' 
        }
      ]);
    } catch (error) {
      console.error('获取 AI 回复失败:', error);
      // 显示错误消息
      setMessages(prev => [
        ...prev, 
        { 
          id: prev.length + 2, 
          text: `请求失败：${error.message}`, 
          sender: 'ai' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;
    
    // 添加用户消息
    const userMessage = { id: messages.length + 1, text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // 获取AI回复
    fetchAIResponse(inputText);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>AI 助手</h1>
      </div>
      
      <div className="messages-container">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.sender === 'user' ? 'user-message' : 'ai-message'}`}
          >
            <div className="message-bubble">
              {message.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message ai-message">
            <div className="message-bubble loading">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-container">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入消息..."
          rows={1}
        />
        <button 
          onClick={handleSendMessage}
          disabled={inputText.trim() === '' || isLoading}
        >
          发送
        </button>
      </div>
    </div>
  );
};

export default Home;
