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
      await renderCategories(categories);
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
      await renderCategories(categories);
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

// 渲染双层分类导航
async function renderCategories(categories) {
  const grid = document.getElementById('category-nav');
  // 只有当有数据时才清空容器
  if (grid.innerHTML.includes('loader') || categories.length > 0) {
    grid.innerHTML = '';
  }

  if (!categories || categories.length === 0) {
    grid.innerHTML = `
            <div style="text-align: center; padding:30px; color:#888;">
                <div class="icon">📭</div>
                <h3>暂无类别</h3>
                <p>题库空空如也~ <br>请点击下方“进入后台管理”添加一些题目吧！</p>
            </div>
        `;
    return;
  }

  // 获取章节数据
  const { data: chapters, error } = await api.getChapters();
  const chapterList = error ? [] : chapters;

  // 遍历生成类别导航
  categories.forEach(cat => {
    const categoryItem = document.createElement('div');
    categoryItem.className = 'category-item';

    const iconEmoji = ICON_MAP[cat.icon] || '❓';

    // 获取该类别的章节
    const categoryChapters = chapterList.filter(chapter => chapter.category === cat.name);

    categoryItem.innerHTML = `
            <div class="category-header" onclick="toggleCategory(this)" tabindex="0" role="button" aria-expanded="false" aria-controls="chapter-list-${cat.id}">
                <div class="category-icon ${cat.color}">
                    ${iconEmoji}
                </div>
                <div class="category-info">
                    <h3>${cat.name}</h3>
                    <p>${cat.description || '点击展开章节'}</p>
                </div>
                <div class="category-toggle" aria-hidden="true">▼</div>
            </div>
            <div class="chapter-list" id="chapter-list-${cat.id}" style="display:none;" role="list">
                ${categoryChapters.length === 0
        ? '<div class="chapter-item no-chapters">暂无章节</div>'
        : categoryChapters.map(chapter => `
                    <div class="chapter-item" role="listitem">
                        <a href="./setup/setup.html?categoryName=${encodeURIComponent(cat.name)}&chapterName=${encodeURIComponent(chapter.name)}" class="chapter-link" aria-label="章节：${chapter.name}">
                            ${chapter.name}
                        </a>
                    </div>
                `).join('')
      }
                <div class="chapter-item all-questions" role="listitem">
                    <a href="./setup/setup.html?categoryName=${encodeURIComponent(cat.name)}" class="chapter-link all-link" aria-label="该类别的所有题目">
                        🔄 该类别的所有题目
                    </a>
                </div>
            </div>
        `;

    // 添加到容器中
    grid.appendChild(categoryItem);
  });
}

// 切换类别展开/折叠
window.toggleCategory = (element) => {
  const categoryItem = element.parentElement;
  const chapterList = categoryItem.querySelector('.chapter-list');
  const toggleIcon = element.querySelector('.category-toggle');

  // 切换显示状态
  if (chapterList.style.display === 'none') {
    chapterList.style.display = 'block';
    toggleIcon.textContent = '▲';
    // 添加展开动画
    chapterList.style.animation = 'slideDown 0.3s ease forwards';
    // 更新 ARIA 属性
    element.setAttribute('aria-expanded', 'true');
  } else {
    chapterList.style.display = 'none';
    toggleIcon.textContent = '▼';
    // 更新 ARIA 属性
    element.setAttribute('aria-expanded', 'false');
  }
};

// 添加键盘导航支持
document.addEventListener('keydown', (e) => {
  // 处理 Enter 键和 Space 键触发类别展开/折叠
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('category-header')) {
    e.preventDefault();
    toggleCategory(e.target);
  }
});

// 启动
document.addEventListener('DOMContentLoaded', () => {
  fetchCategories();
});