import React, { useState, useRef, useEffect } from 'react';
import { getStreamUrl } from '../../api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github.css';
import './index.css';

const Home = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: '你好，我是AI助手，有什么可以帮助你的？', sender: 'ai' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const eventSourceRef = useRef(null); // 存储 EventSource 实例

  // 自动滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      // 清除所有事件源
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // 使用流式输出获取回复
  const fetchStreamAIResponse = async (userMessage) => {
    setIsLoading(true);
    
    try {
      // 获取流式输出 URL
      const streamUrl = await getStreamUrl(userMessage);
      
      // 先添加一个空的回复，后续流式更新
      const newMessageId = messages.length + 2;
      setMessages(prev => [
        ...prev, 
        { 
          id: newMessageId, 
          text: '', 
          sender: 'ai',
          isStreaming: true // 标记为正在流式输出
        }
      ]);
      
      // 创建 EventSource
      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;
      
      // 处理开始事件
      eventSource.addEventListener('start', (event) => {
        console.log('Stream started:', event.data);
      });
      
      // 处理消息事件
      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages(prev => {
            // 找到正在流式输出的消息
            return prev.map(msg => {
              if (msg.id === newMessageId) {
                // 追加内容
                return { 
                  ...msg, 
                  text: msg.text + (data.content || '') 
                };
              }
              return msg;
            });
          });
        } catch (error) {
          console.error('解析消息错误:', error);
        }
      });
      
      // 处理完成事件
      eventSource.addEventListener('done', () => {
        console.log('Stream completed');
        // 更新消息，移除 isStreaming 标记
        setMessages(prev => {
          return prev.map(msg => {
            if (msg.id === newMessageId) {
              const { isStreaming, ...restMsg } = msg;
              return restMsg;
            }
            return msg;
          });
        });
        // 关闭 EventSource
        eventSource.close();
        eventSourceRef.current = null;
        setIsLoading(false);
      });
      
      // 处理错误事件
      eventSource.addEventListener('error', (event) => {
        console.error('Stream error:', event);
        // 更新消息，添加错误提示
        setMessages(prev => {
          return prev.map(msg => {
            if (msg.id === newMessageId && msg.isStreaming) {
              const { isStreaming, ...restMsg } = msg;
              return { 
                ...restMsg, 
                text: msg.text || '流式响应出错，请重试' 
              };
            }
            return msg;
          });
        });
        // 关闭 EventSource
        eventSource.close();
        eventSourceRef.current = null;
        setIsLoading(false);
      });
      
    } catch (error) {
      console.error('获取流式响应失败:', error);
      // 显示错误消息
      setMessages(prev => [
        ...prev, 
        { 
          id: messages.length + 2, 
          text: `请求失败：${error.message}`, 
          sender: 'ai' 
        }
      ]);
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (inputText.trim() === '' || isLoading) return;
    
    // 如果有正在进行的流式响应，先关闭它
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // 添加用户消息
    const userMessage = { id: messages.length + 1, text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // 获取AI回复
    fetchStreamAIResponse(inputText);
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
          rehypePlugins={[rehypeRaw]}
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
              {message.isStreaming && (
                <span className="cursor-blink">|</span>
              )}
            </div>
          </div>
        ))}
        {isLoading && !messages.find(m => m.isStreaming) && (
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
          disabled={isLoading}
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
