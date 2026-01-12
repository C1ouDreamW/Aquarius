// 全局配置
const API_BASE = '/api/shuashua';

// 封装 Fetch 请求
async function request(endpoint, options = {}) {
  try {
    // 检查是否为公开接口（不需要认证）
    const publicEndpoints = {
      GET: ['/categories', '/questions'],
      POST: [],
      DELETE: []
    };
    const method = (options.method || 'GET').toUpperCase();
    const isPublic = publicEndpoints[method]?.some(publicEndpoint =>
      endpoint === publicEndpoint || endpoint.startsWith(publicEndpoint + '/')
    ) || false;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // 只有非公开接口才需要认证 token
    if (!isPublic) {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        // 没有token，跳转到登录页面
        window.location.href = '/shua/admin/admin.html';
        return { data: null, error: new Error('No access token') };
      }
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers,
      ...options
    });

    if (res.status === 401 || res.status === 403) {
      // 清除无效token并跳转到登录页面
      localStorage.removeItem('access_token');
      window.location.href = '/shua/admin/admin.html';
      return { data: null, error: new Error('Authentication failed') };
    }

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const json = await res.json();

    if (!json.success) throw new Error(json.message || 'Request failed');
    return { data: json.data, error: null };
  } catch (err) {
    console.error('API Error:', err);
    return { data: null, error: err };
  }
}

// 导出 API 对象
export const api = {
  // 获取类别
  getCategories: () => request('/categories'),

  // 获取题目
  getQuestions: (category) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/questions${query}`);
  },

  // 获取章节
  getChapters: (category) => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/chapters${query}`);
  },

  // 登录
  signIn: async (username, password) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const json = await res.json();
    if (json.success) return { data: json, error: null };
    return { data: null, error: { message: json.message } };
  },

  // 增删改
  addCategory: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  addQuestion: (data) => request('/questions', { method: 'POST', body: JSON.stringify(data) }),
  deleteQuestion: (id) => request(`/questions/${id}`, { method: 'DELETE' }),
  addChapter: (data) => request('/chapters', { method: 'POST', body: JSON.stringify(data) }),
  deleteChapter: (id) => request(`/chapters/${id}`, { method: 'DELETE' })
};


export function initTheme() {
  const themeBtn = document.getElementById('theme-btn');
  const themeIcon = document.getElementById('theme-icon');
  const body = document.body;

  const sunPath = "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z";
  const moonPath = "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z";

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    themeIcon.querySelector('path').setAttribute('d', moonPath);
  }

  themeBtn.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
      themeIcon.querySelector('path').setAttribute('d', moonPath);
      localStorage.setItem('theme', 'dark');
    } else {
      themeIcon.querySelector('path').setAttribute('d', sunPath);
      localStorage.setItem('theme', 'light');
    }
  });
}

export function initTransitions() {
  const container = document.querySelector('.container');
  if (container) container.style.animation = 'fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards';

  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      const target = link.getAttribute('target');
      if (!href || href.startsWith('#') || href.startsWith('javascript:') || target === '_blank') return;

      e.preventDefault();
      document.body.classList.add('page-exiting');
      setTimeout(() => { window.location.href = href; }, 500);
    });
  });

  window.addEventListener('pageshow', (event) => {
    if (event.persisted) document.body.classList.remove('page-exiting');
  });
}

// 图标映射
export const ICON_MAP = {
  'Cpu': '💾',
  'Code': '👨‍💻',
  'Earth': '🌍',
  'Beaker': '⚗️',
  'BookOpen': '📖',
  'Lightbulb': '💡',
  'Rocket': '🚀',
  'NotepadText': '📝',
  'HelpCircle': '❓'
};