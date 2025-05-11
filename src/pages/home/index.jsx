import React, { useState, useRef, useEffect } from 'react';
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

  // 模拟AI回复
  const simulateAIResponse = (userMessage) => {
    setIsLoading(true);
    
    // 模拟API调用延迟
    setTimeout(() => {
      const aiResponses = [
        '我理解你的问题，让我思考一下...',
        '这是个有趣的问题！',
        '根据我的理解，这个问题的答案是...',
        '我可以帮你解决这个问题。',
        '需要更多信息才能回答这个问题。'
      ];
      
      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      setMessages(prev => [
        ...prev, 
        { 
          id: prev.length + 2, 
          text: randomResponse, 
          sender: 'ai' 
        }
      ]);
      
      setIsLoading(false);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (inputText.trim() === '') return;
    
    // 添加用户消息
    const userMessage = { id: messages.length + 1, text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // 获取AI回复
    simulateAIResponse(inputText);
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
