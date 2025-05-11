/**
 * API 模块
 * 定义所有后端接口的地址和调用方法
 */
import { graphqlRequest } from '../utils/http';

// API 配置
const API_CONFIG = {
  // GraphQL API 端点
  // GRAPHQL_URL: 'http://api.skerd.cn/graphql',
  GRAPHQL_URL: 'http://localhost:8787/graphql',

  // 可以在这里添加其他 API 配置，如鉴权令牌等
};

// GraphQL 查询定义
const QUERIES = {
  // 欢迎消息查询
  HELLO: `
    query {
      hello
    }
  `,

  // 聊天消息变更
  CHAT: `
    mutation Chat($message: String!, $systemPrompt: String) {
      chat(
        message: $message,
        systemPrompt: $systemPrompt
      ) {
        id
        choices {
          index
          message {
            role
            content
          }
          finish_reason
        }
        usage {
          prompt_tokens
          completion_tokens
          total_tokens
        }
      }
    }
  `,

  // 流式聊天消息变更
  CHAT_STREAM: `
    mutation ChatStream($message: String!, $systemPrompt: String) {
      chatStream(
        message: $message,
        systemPrompt: $systemPrompt
      )
    }
  `,
};

/**
 * 向 AI 发送消息并获取回复
 * @param {string} message - 用户消息
 * @param {string} systemPrompt - 可选的系统提示
 * @returns {Promise<Object>} - AI 回复内容
 */
export const sendMessageToAI = async (message, systemPrompt) => {
  // 为了获得更好的 Markdown 格式内容，添加提示鼓励 AI 使用 Markdown
  const enhancedSystemPrompt = systemPrompt || "你是一个有用的AI助手。回复时尽量使用Markdown格式，可以使用标题、列表、代码块、表格等Markdown元素使回复更易读。代码要用 ```语言名 包裹。";

  // 发送 GraphQL 请求
  const variables = {
    message,
    systemPrompt: enhancedSystemPrompt
  };

  // 使用 http 模块发送请求
  const result = await graphqlRequest(
    API_CONFIG.GRAPHQL_URL,
    QUERIES.CHAT,
    variables
  );

  return result.chat;
};

/**
 * 获取 GraphQL API 的欢迎消息
 * @returns {Promise<string>} - 欢迎消息
 */
export const getHelloMessage = async () => {
  // 使用 http 模块发送请求
  const result = await graphqlRequest(
    API_CONFIG.GRAPHQL_URL,
    QUERIES.HELLO
  );

  return result.hello;
};

/**
 * 向 AI 发送消息并获取流式回复的 URL
 * @param {string} message - 用户消息
 * @param {string} systemPrompt - 可选的系统提示
 * @returns {Promise<string>} - 流式响应 URL
 */
export const getStreamUrl = async (message, systemPrompt) => {
  // 为了获得更好的 Markdown 格式内容，添加提示鼓励 AI 使用 Markdown
  const enhancedSystemPrompt = systemPrompt || "你是一个有用的AI助手。回复时尽量使用Markdown格式，可以使用标题、列表、代码块、表格等Markdown元素使回复更易读。代码要用 ```语言名 包裹。";

  // 发送 GraphQL 请求
  const variables = {
    message,
    systemPrompt: enhancedSystemPrompt
  };

  // 使用 http 模块发送请求
  const result = await graphqlRequest(
    API_CONFIG.GRAPHQL_URL,
    QUERIES.CHAT_STREAM,
    variables
  );

  return result.chatStream;
};

// 导出默认对象，包含所有 API 方法
export default {
  sendMessageToAI,
  getHelloMessage,
  getStreamUrl
}; 