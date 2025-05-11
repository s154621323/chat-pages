import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToAI } from '../../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight/lib';
import 'highlight.js/styles/github.css';
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

  // 渲染消息内容，支持 Markdown
  const renderMessageContent = (text, isUser) => {
    if (isUser) {
      // 用户消息不使用 Markdown 渲染
      return <div className="message-text">{text}</div>;
    }
    
    // AI 消息使用 Markdown 渲染
    return (
      <div className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeHighlight]}
          components={{
            // 自定义链接在新标签页打开
            a: ({ node, ...props }) => (
              <a target="_blank" rel="noopener noreferrer" {...props} />
            ),
            // 让图片响应式显示
            img: ({ node, ...props }) => (
              <img style={{ maxWidth: '100%' }} {...props} alt={props.alt || ''} />
            ),
            // 为代码块添加样式
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <div className="code-block-wrapper">
                  <div className="code-block-header">
                    <span>{match[1]}</span>
                  </div>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </div>
              ) : (
                <code className={inline ? 'inline-code' : ''} {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
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
              {renderMessageContent(message.text, message.sender === 'user')}
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
