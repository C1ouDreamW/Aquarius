import { api, initTheme, initTransitions, ICON_MAP } from './global.js';

// 1. 初始化通用功能
initTheme();
initTransitions();

// 获取 DOM 容器
const grid = document.getElementById('category-grid');

// 2. 获取类别数据
async function fetchCategories() {
  try {
    // 查询数据库
    const { data: categories, error } = await api.getCategories();

    if (error) throw error;

    // 渲染数据
    renderCategories(categories);

  } catch (err) {
    console.error("加载类别失败:", err);
    grid.innerHTML = `
            <div class="card" style="grid-column: 1/-1; text-align: center; color: #ef4444; border-color: #fecaca;">
                <div class="icon">⚠️</div>
                <h3>加载失败</h3>
                <p>无法连接到数据库，请检查网络或控制台日志。</p>
            </div>
        `;
  }
}

// 3. 渲染卡片逻辑
function renderCategories(categories) {
  grid.innerHTML = ''; // 清空加载动画

  // 空状态处理
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
    // 创建链接卡片
    const card = document.createElement('a');
    card.className = 'card';
    // 点击跳转到设置页，并带上 ID
    card.href = `setup.html?categoryId=${cat.id}`;

    // 获取 Emoji 图标，如果没有匹配则显示问号
    const iconEmoji = ICON_MAP[cat.icon] || '❓';

    // 组装 HTML
    // 注意：cat.color 对应的是我们在 style.css 里写的 .bg-purple-100 等类名
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

// 4. 启动！
document.addEventListener('DOMContentLoaded', () => {
  fetchCategories();
});