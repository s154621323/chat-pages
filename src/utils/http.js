/**
 * HTTP 请求工具模块
 * 负责处理所有网络请求的底层逻辑
 */

/**
 * 发送 HTTP 请求
 * @param {string} url - 请求 URL
 * @param {Object} options - 请求选项
 * @returns {Promise<any>} - 响应数据
 */
export const request = async (url, options = {}) => {
  try {
    // 默认选项
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // 合并选项
    const fetchOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {}),
      },
    };

    // 如果有请求体且是对象，将其转换为 JSON 字符串
    if (fetchOptions.body && typeof fetchOptions.body === 'object') {
      fetchOptions.body = JSON.stringify(fetchOptions.body);
    }

    // 发送请求
    const response = await fetch(url, fetchOptions);

    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP 错误 ${response.status}: ${errorText}`);
    }

    // 根据 Content-Type 解析响应
    const contentType = response.headers.get('Content-Type') || '';

    if (contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error('请求失败:', error);
    throw error;
  }
};

/**
 * 发送 GraphQL 请求
 * @param {string} url - GraphQL 服务器 URL
 * @param {string} query - GraphQL 查询字符串
 * @param {Object} variables - GraphQL 变量
 * @returns {Promise<Object>} - GraphQL 响应数据
 */
export const graphqlRequest = async (url, query, variables = {}) => {
  try {
    const response = await request(url, {
      method: 'POST',
      body: {
        query,
        variables,
      },
    });

    // 检查 GraphQL 错误
    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0].message);
    }

    return response.data;
  } catch (error) {
    console.error('GraphQL 请求失败:', error);
    throw error;
  }
};

// 导出 HTTP 方法的快捷函数
export const get = (url, params = {}, options = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;
  return request(fullUrl, { ...options, method: 'GET' });
};

export const post = (url, data, options = {}) => {
  return request(url, {
    ...options,
    method: 'POST',
    body: data,
  });
};

// 定义HTTP对象
const HTTP = {
  request,
  graphqlRequest,
  get,
  post,
};

// 导出默认对象
export default HTTP; 