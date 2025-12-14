import { api, initTheme, initTransitions, ICON_MAP } from './global.js';

// 初始化通用功能
initTheme();
initTransitions();

// 获取 DOM 容器
const grid = document.getElementById('category-grid');
const CACHE_KEY = 'shua_categories_cache';

// 获取类别数据
async function fetchCategories() {
  const cachedData = sessionStorage.getItem(CACHE_KEY);
  if (cachedData) {
    try {
      const categories = JSON.parse(cachedData);
      renderCategories(categories);
      console.log('🚀 Loaded from cache');
    } catch (e) {
      console.warn('Cache parse error', e);
    }
  }

  try {

    const { data: categories, error } = await api.getCategories();

    if (error) throw error;

    const isDataChanged = JSON.stringify(categories) !== cachedData;

    if (isDataChanged) {
      console.log('🔄 Data updated from server');
      // 更新缓存
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(categories));
      // 重新渲染
      renderCategories(categories);
    } else {
      console.log('✅ Data is up to date');
    }

  } catch (err) {
    console.error("加载类别失败:", err);
    if (!cachedData) {
      grid.innerHTML = `
            <div class="card" style="grid-column: 1/-1; text-align: center; color: #ef4444; border-color: #fecaca;">
                <div class="icon">⚠️</div>
                <h3>加载失败</h3>
                <p>无法连接到数据库，请检查网络或控制台日志。</p>
            </div>
        `;
    }
  }
}

// 渲染卡片逻辑
function renderCategories(categories) {
  // 只有当有数据时才清空容器
  if (grid.innerHTML.includes('loader') || categories.length > 0) {
    grid.innerHTML = '';
  }

  if (!categories || categories.length === 0) {
    grid.innerHTML = `
            <div class="card" style="grid-column: 1/-1; text-align: center; cursor: default;">
                <div class="icon">📭</div>
                <h3>暂无类别</h3>
                <p>题库空空如也~ <br>请点击下方“进入后台管理”添加一些题目吧！</p>
            </div>
        `;
    return;
  }

  // 遍历生成卡片
  categories.forEach(cat => {
    const card = document.createElement('a');
    card.className = 'card';
    card.href = `./setup/setup.html?categoryId=${cat.id}`;

    const iconEmoji = ICON_MAP[cat.icon] || '❓';

    card.innerHTML = `
            <div class="category-icon ${cat.color}">
                ${iconEmoji}
            </div>
            <div>
                <h3>${cat.name}</h3>
                <p>${cat.description || '点击开始练习'}</p>
            </div>
            <div style="margin-top: 15px; text-align: right; color: var(--text-sub); font-size: 0.8rem;">
                进入练习 ➔
            </div>
        `;

    // 添加到网格中
    grid.appendChild(card);
  });
}

// 启动
document.addEventListener('DOMContentLoaded', () => {
  fetchCategories();
});