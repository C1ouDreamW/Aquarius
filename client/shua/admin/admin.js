import { api, initTheme, initTransitions, ICON_MAP } from '../global.js';

initTheme();
initTransitions();


const COLORS = [
  { label: '紫色', class: 'bg-purple-100' },
  { label: '蓝色', class: 'bg-blue-100' },
  { label: '琥珀', class: 'bg-amber-100' },
  { label: '绿色', class: 'bg-green-100' },
  { label: '红色', class: 'bg-red-100' },
  { label: '粉色', class: 'bg-pink-100' },
  { label: '青色', class: 'bg-cyan-100' },
  { label: '靛蓝', class: 'bg-indigo-100' },
];

let categories = [];
let chapters = [];
let questions = [];
let createQOptions = [
  { id: 'opt1', text: '' },
  { id: 'opt2', text: '' }
];
let selectedIcon = 'Cpu';
let selectedColor = 'bg-purple-100';

// 登录
const loginModal = document.getElementById('login-modal');
const adminDashboard = document.getElementById('admin-dashboard');
const loginBtn = document.getElementById('login-btn');
const usernameInput = document.getElementById('admin-username');
const passInput = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');

// 导航
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

// 创建题目
const categorySelect = document.getElementById('q-category-select');
const chapterSelect = document.getElementById('q-chapter-select');
const qText = document.getElementById('q-text');
const optionsContainer = document.getElementById('options-container');
const addOptionBtn = document.getElementById('add-option-btn');
const qExplanation = document.getElementById('q-explanation');
const saveQBtn = document.getElementById('save-q-btn');

// 章节管理
const chapterCategorySelect = document.getElementById('chapter-category-select');
const chapterName = document.getElementById('chapter-name');
const saveChapterBtn = document.getElementById('save-chapter-btn');
const chaptersListDiv = document.getElementById('chapters-list');

// 创建类别
const catName = document.getElementById('cat-name');
const catDesc = document.getElementById('cat-desc');
const iconSelector = document.getElementById('icon-selector');
const colorSelector = document.getElementById('color-selector');
const saveCatBtn = document.getElementById('save-cat-btn');
const categoriesListDiv = document.getElementById('categories-list');

// 题目
// const questionsTableBody = document.querySelector('#questions-table tbody');
const groupedContainer = document.getElementById('grouped-questions-container');
const questionsLoader = document.getElementById('questions-loader');


if (localStorage.getItem('access_token')) {
  showDashboard();
}

// 登录按钮点击事件
loginBtn.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const password = passInput.value.trim();

  if (!username || !password) {
    showError('请输入用户名和密码');
    return;
  }

  loginBtn.innerText = '登录中...';
  loginBtn.disabled = true;
  loginError.style.display = 'none';

  try {
    const { data, error } = await api.signIn(username, password);

    if (error) {
      console.error('登录失败:', error);
      const msg = error.message === 'Invalid login credentials'
        ? '账号或密码错误'
        : error.message;
      showError(msg);
      loginBtn.innerText = '登录';
      loginBtn.disabled = false;
    } else {
      // 登录成功，保存 token
      if (data.token) {
        localStorage.setItem('access_token', data.token);
      }
      showDashboard();
    }
  } catch (err) {
    console.error("请求异常:", err);
    showError("网络请求发生错误");
    loginBtn.innerText = '登录';
    loginBtn.disabled = false;
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('access_token');
  location.reload();
});

function showDashboard() {
  loginModal.style.display = 'none';
  adminDashboard.style.display = 'block';
  loadCategories();
  loadChapters();
  loadQuestions();
}

function showError(msg) {
  loginError.innerText = msg;
  loginError.style.display = 'block';
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(t => t.classList.remove('active'));

    btn.classList.add('active');
    const tabId = btn.dataset.tab;
    document.getElementById(`tab-${tabId}`).classList.add('active');

    if (tabId === 'create-q' || tabId === 'category') {
      loadCategories();
      loadChapters();
    }
    if (tabId === 'list-q') loadQuestions();
  });
});


async function loadCategories() {
  const { data, error } = await api.getCategories();

  if (!error) {
    categories = data;
    renderCategorySelect();
    renderCategoriesList();
  }
}

async function loadQuestions() {
  questionsLoader.style.display = 'block';
  const { data, error } = await api.getQuestions();

  questionsLoader.style.display = 'none';

  if (!error) {
    questions = data;
    renderQuestionsTable();
  }
}


function renderCategorySelect() {
  categorySelect.innerHTML = categories.length === 0
    ? '<option disabled selected>请先去创建类别</option>'
    : categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

  chapterCategorySelect.innerHTML = categories.length === 0
    ? '<option disabled selected>请先去创建类别</option>'
    : categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

async function loadChapters() {
  const { data, error } = await api.getChapters();

  if (!error) {
    chapters = data || [];
    renderChapterSelect();
    renderChaptersList();
  }
}

function renderChapterSelect() {
  const selectedCategory = categorySelect.value;
  const categoryChapters = chapters.filter(chapter => chapter.category === selectedCategory);

  chapterSelect.innerHTML = categoryChapters.length === 0
    ? '<option disabled selected>请先为该类别添加章节</option>'
    : categoryChapters.map(chapter => `<option value="${chapter.name}">${chapter.name}</option>`).join('');
}

function renderOptions() {
  const type = document.querySelector('input[name="q-type"]:checked').value;
  const isSingle = type === 'single_choice';

  optionsContainer.innerHTML = '';

  createQOptions.forEach((opt, index) => {
    const div = document.createElement('div');
    div.className = 'option-item';

    const checkInput = document.createElement('input');
    checkInput.type = isSingle ? 'radio' : 'checkbox';
    checkInput.name = 'correct-answer';
    checkInput.className = 'option-radio';
    checkInput.dataset.index = index;

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.className = 'input-field';
    textInput.value = opt.text;
    textInput.placeholder = `选项 ${index + 1}`;
    textInput.style.marginBottom = '0';
    textInput.oninput = (e) => { createQOptions[index].text = e.target.value; };

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.innerHTML = '🗑️';
    delBtn.onclick = () => {
      if (createQOptions.length <= 2) return alert('至少要有两个选项');
      createQOptions.splice(index, 1);
      renderOptions();
    };

    div.appendChild(checkInput);
    div.appendChild(textInput);
    div.appendChild(delBtn);
    optionsContainer.appendChild(div);
  });
}

document.querySelectorAll('input[name="q-type"]').forEach(radio => {
  radio.addEventListener('change', renderOptions);
});

addOptionBtn.addEventListener('click', () => {
  createQOptions.push({ id: Math.random().toString(36).substr(2, 9), text: '' });
  renderOptions();
});

renderOptions();

// 类别选择变化时更新章节选择器
categorySelect.addEventListener('change', renderChapterSelect);

// 章节类别选择变化时更新章节列表
chapterCategorySelect.addEventListener('change', renderChaptersList);

// 保存章节
saveChapterBtn.addEventListener('click', async () => {
  const category = chapterCategorySelect.value;
  const name = chapterName.value.trim();

  if (!category) return alert('请选择类别');
  if (!name) return alert('请输入章节名称');

  // 检查章节是否已存在
  const existingChapter = chapters.find(chapter =>
    chapter.category === category && chapter.name === name
  );

  if (existingChapter) return alert('该章节已存在');

  saveChapterBtn.innerText = '保存中...';
  saveChapterBtn.disabled = true;

  try {
    // 添加新章节
    const newChapter = {
      id: crypto.randomUUID(),
      category,
      name,
      created_at: new Date().toISOString()
    };

    const { error } = await api.addChapter(newChapter);

    if (error) throw error;

    await loadChapters();
    chapterName.value = '';
    alert('章节添加成功！');
  } catch (err) {
    console.error(err);
    alert('保存失败: ' + (err.message || '未知错误'));
  } finally {
    saveChapterBtn.innerText = '保存章节';
    saveChapterBtn.disabled = false;
  }
});

function renderChaptersList() {
  const selectedCategory = chapterCategorySelect.value;
  const categoryChapters = chapters.filter(chapter => chapter.category === selectedCategory);

  chaptersListDiv.innerHTML = categoryChapters.length === 0
    ? '<div style="text-align:center; padding:20px; color:#888;">暂无章节</div>'
    : categoryChapters.map(chapter => `
      <div class="list-group-item">
        <div>
          <strong>${chapter.name}</strong>
        </div>
        <button class="btn-delete" onclick="deleteChapter('${chapter.id}')">🗑️</button>
      </div>
    `).join('');
}

window.deleteChapter = async (id) => {
  if (!confirm('确定删除该章节吗？')) return;

  try {
    const { error } = await api.deleteChapter(id);
    if (error) throw error;
    await loadChapters();
  } catch (err) {
    console.error(err);
    alert('删除失败: ' + (err.message || '未知错误'));
  }
};

// 保存题目
saveQBtn.addEventListener('click', async () => {
  const category = categorySelect.value;
  const chapter = chapterSelect.value;
  const type = document.querySelector('input[name="q-type"]:checked').value;
  const text = qText.value.trim();
  const explanation = qExplanation.value.trim();

  if (!category) return alert('请先选择类别');
  if (!chapter) return alert('请选择章节');
  if (!text) return alert('请输入题目描述');
  if (createQOptions.some(o => !o.text.trim())) return alert('请填写所有选项内容');

  const inputs = document.querySelectorAll('input[name="correct-answer"]');
  const correctIds = [];
  inputs.forEach((input, idx) => {
    if (input.checked) correctIds.push(createQOptions[idx].id);
  });

  if (correctIds.length === 0) return alert('请至少勾选一个正确答案');

  saveQBtn.innerText = '保存中...';
  saveQBtn.disabled = true;

  try {

    const newQuestion = {
      id: crypto.randomUUID(),
      category,
      chapter,
      type,
      text,
      options: createQOptions,
      correct_option_ids: correctIds,
      explanation,
      created_at: new Date().toISOString()
    };

    const { error } = await api.addQuestion(newQuestion);

    if (error) throw error;

    alert('题目添加成功！');
    qText.value = '';
    qExplanation.value = '';
    createQOptions = [
      { id: Math.random().toString(36).substr(2, 9), text: '' },
      { id: Math.random().toString(36).substr(2, 9), text: '' }
    ];
    renderOptions();

  } catch (err) {
    console.error(err);
    alert('保存失败: ' + (err.message || '未知错误'));
  } finally {
    saveQBtn.innerText = '保存题目';
    saveQBtn.disabled = false;
  }
});


// function renderQuestionsTable() {
//   questionsTableBody.innerHTML = questions.length === 0
//     ? '<tr><td colspan="4" style="text-align:center; padding:20px;">暂无题目</td></tr>'
//     : questions.map(q => `
//             <tr>
//                 <td>${q.text.substring(0, 20)}...</td>
//                 <td>${q.category}</td>
//                 <td>${q.type === 'SINGLE_CHOICE' ? '单选' : '多选'}</td>
//                 <td class="col-action">
//                     <button onclick="deleteQuestion('${q.id}')" title="删除">🗑️</button>
//                 </td>
//             </tr>
//         `).join('');
// }

// admin.js

// 中文数字映射表
const cnNumMap = {
  '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
  '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15,
  '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20
};

// 计算排序权重的函数
function getSortWeight(str) {
  // 优先检测阿拉伯数字 (如: "第1章", "2. 测试")
  const arabMatch = str.match(/\d+/);
  if (arabMatch) {
    return parseInt(arabMatch[0]); // 返回找到的数字，例如 2
  }

  // 检测中文数字 (如: "第一章", "毛概-第七章")
  // 我们尝试匹配 "第X" 或者直接包含的中文数字
  for (let key in cnNumMap) {
    if (str.includes(key)) {
      // 为了防止 "十一" 被误识别为 "十" 和 "一"，我们需要最长匹配优先
      // 但简单的 includes 往往够用，只要 key 顺序得当（通常不用太纠结，除非你有第111章）
      // 这里做一个简单的处理：如果是 "十二"，includes('十') 也为 true。
      // 所以我们直接返回匹配到的第一个映射值即可，实际排序中
      // 我们稍微优化一下：优先匹配双字（如十一），再匹配单字

      // 更严谨的逻辑：正则提取
      const cnMatch = str.match(/[一二三四五六七八九十]+/);
      if (cnMatch) {
        const numStr = cnMatch[0];
        // 尝试直接查表，处理 "十一" 这种
        if (cnNumMap[numStr]) return cnNumMap[numStr];

        // 如果是 "二十一"，表里没有，就回退到简单的单字权重
        // 这里简单起见，返回查到的第一个单字的权重
        return cnNumMap[numStr.charAt(0)] || 9999;
      }
    }
  }

  // 如果都没有数字，返回一个很大的数，让它们排在后面
  return 9999;
}

function renderQuestionsTable() {
  groupedContainer.innerHTML = '';

  if (questions.length === 0) {
    groupedContainer.innerHTML = '<div style="text-align:center; padding:30px; color:#888;">暂无题目，快去添加吧~</div>';
    return;
  }

  // 数据按类别分组
  const groupedData = {};
  questions.forEach(q => {
    // 如果没有类别，归类为 "未分类"
    const cat = q.category || '未分类';
    if (!groupedData[cat]) {
      groupedData[cat] = [];
    }
    groupedData[cat].push(q);
  });
  const sortedCategoryNames = Object.keys(groupedData).sort((a, b) => {
    // 特殊处理：把 "未分类" 扔到最后
    if (a === '未分类') return 1;
    if (b === '未分类') return -1;

    // 获取两个字符串的数字权重
    const weightA = getSortWeight(a);
    const weightB = getSortWeight(b);

    // 如果两个都能提取出数字，按数字大小排
    if (weightA !== weightB) {
      return weightA - weightB;
    }

    // 如果数字权重一样，则按拼音排序
    return a.localeCompare(b, 'zh-CN');
  });

  // 遍历每个类别生成 HTML
  sortedCategoryNames.forEach(categoryName => {
    const categoryQuestions = groupedData[categoryName];

    // 创建外层 Group 容器
    const groupDiv = document.createElement('div');
    groupDiv.className = 'category-group';

    // 生成头部 HTML
    const headerHtml = `
      <div class="category-group-header">
        <div>
          <span class="cat-title">${categoryName}</span>
          <span class="cat-count">${categoryQuestions.length} 题</span>
        </div>
        <span class="toggle-icon">▼</span>
      </div>
    `;

    // 生成表格内容 HTML
    const rowsHtml = categoryQuestions.map(q => `
      <tr>
        <td style="width: 60%;">${(q.text || q.question || '').substring(0, 30)}${(q.text || q.question || '').length > 30 ? '...' : ''}</td>
        <td style="width: 20%; color:#666; font-size:0.9em;">
          ${q.type === 'single_choice' ? '<span style="color:#28a745">● 单选</span>' : '<span style="color:#007bff">● 多选</span>'}
        </td>
        <td style="width: 20%; text-align: right;">
          <button class="btn-delete" onclick="deleteQuestion('${q.id}')" title="删除">🗑️ 删除</button>
        </td>
      </tr>
    `).join('');

    const contentHtml = `
      <div class="category-content">
        <table class="category-table">
          <thead>
            <tr>
              <th>题目内容</th>
              <th>题型</th>
              <th style="text-align: right;">操作</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    groupDiv.innerHTML = headerHtml + contentHtml;

    // 绑定点击事件：点击头部切换展开/收起
    const header = groupDiv.querySelector('.category-group-header');
    header.addEventListener('click', () => {
      // 切换当前组的 active 类
      groupDiv.classList.toggle('active');
    });

    groupedContainer.appendChild(groupDiv);
  });
}

window.deleteQuestion = async (id) => {
  if (!confirm('确定删除这道题吗？')) return;
  try {
    const { error } = await api.deleteQuestion(id);
    if (error) throw error;
    loadQuestions();
  } catch (err) {
    alert('删除失败');
  }
};


iconSelector.innerHTML = Object.keys(ICON_MAP).map(key => `
    <div class="selector-item ${key === 'Cpu' ? 'selected' : ''}" onclick="selectIcon('${key}')">
        ${ICON_MAP[key]}
    </div>
`).join('');

colorSelector.innerHTML = COLORS.map(c => `
    <div class="color-item ${c.class} ${c.class === 'bg-purple-100' ? 'selected' : ''}" 
         onclick="selectColor('${c.class}')"></div>
`).join('');

window.selectIcon = (icon) => {
  selectedIcon = icon;
  document.querySelectorAll('#icon-selector .selector-item').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
};

window.selectColor = (color) => {
  selectedColor = color;
  document.querySelectorAll('#color-selector .color-item').forEach(el => el.classList.remove('selected'));
  event.currentTarget.classList.add('selected');
};

saveCatBtn.addEventListener('click', async () => {
  const name = catName.value.trim();
  if (!name) return alert('请输入类别名称');

  saveCatBtn.innerText = '保存中...';
  try {
    const newCategory = {
      id: crypto.randomUUID(),
      name,
      description: catDesc.value.trim(),
      icon: selectedIcon,
      color: selectedColor,
      created_at: new Date().toISOString()
    };

    const { error } = await api.addCategory(newCategory);

    if (error) throw error;
    alert('类别创建成功！');
    catName.value = '';
    catDesc.value = '';
    loadCategories();

  } catch (err) {
    alert('保存失败: ' + err.message);
  } finally {
    saveCatBtn.innerText = '保存类别';
  }
});

function renderCategoriesList() {
  categoriesListDiv.innerHTML = categories.map(c => `
        <div class="list-group-item">
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="${c.color}" style="padding:5px; border-radius:5px;">${ICON_MAP[c.icon] || '❓'}</span>
                <div>
                    <strong>${c.name}</strong>
                    <div style="font-size:0.8rem; color:grey;">${c.description || '无描述'}</div>
                </div>
            </div>
            <button class="btn-delete" onclick="deleteCategory('${c.id}')">🗑️</button>
        </div>
    `).join('');
}

window.deleteCategory = async (id) => {
  if (!confirm('⚠️ 警告：删除类别可能会导致该类别下的题目无法显示。\n确定要删除吗？')) return;

  try {
    const { error } = await api.deleteCategory(id);
    if (error) throw error;
    loadCategories();
  } catch (err) {
    alert('删除失败: ' + err.message);
  }
};