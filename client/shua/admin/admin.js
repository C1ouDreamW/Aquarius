import { api, initTheme, initTransitions, ICON_MAP } from './global.js';

initTheme();
initTransitions();

// ================= 配置 =================
// ❌ 删除：const ADMIN_PASSWORD = "admin123"; 
// 现在身份验证交给后端 Auth 处理，不需要前端硬编码密码了

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

// ================= 状态 =================
let categories = [];
let questions = [];
let createQOptions = [
  { id: 'opt1', text: '' },
  { id: 'opt2', text: '' }
];
// 新增类别的临时状态
let selectedIcon = 'Cpu';
let selectedColor = 'bg-purple-100';

// ================= DOM 元素 =================
// 登录
const loginModal = document.getElementById('login-modal');
const adminDashboard = document.getElementById('admin-dashboard');
const loginBtn = document.getElementById('login-btn');
const emailInput = document.getElementById('admin-email'); // 确保 HTML 里有这个 ID
const passInput = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');

// 导航
const navBtns = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');

// 表单 - 创建题目
const categorySelect = document.getElementById('q-category-select');
const qText = document.getElementById('q-text');
const optionsContainer = document.getElementById('options-container');
const addOptionBtn = document.getElementById('add-option-btn');
const qExplanation = document.getElementById('q-explanation');
const saveQBtn = document.getElementById('save-q-btn');

// 表单 - 创建类别
const catName = document.getElementById('cat-name');
const catDesc = document.getElementById('cat-desc');
const iconSelector = document.getElementById('icon-selector');
const colorSelector = document.getElementById('color-selector');
const saveCatBtn = document.getElementById('save-cat-btn');
const categoriesListDiv = document.getElementById('categories-list');

// 列表 - 题目
const questionsTableBody = document.querySelector('#questions-table tbody');
const questionsLoader = document.getElementById('questions-loader');

// ================= 1. 认证逻辑 =================

// 简单检查本地是否有 token 标记 (实际校验在后端)
if (localStorage.getItem('admin_token')) {
  showDashboard();
}

// 登录按钮点击事件
loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passInput.value.trim();

  if (!email || !password) {
    showError('请输入邮箱和密码');
    return;
  }

  loginBtn.innerText = '登录中...';
  loginBtn.disabled = true;
  loginError.style.display = 'none';

  try {
    // ✨ 修复 1: 使用 api.signIn 替代 supabase.auth
    const { data, error } = await api.signIn(email, password);

    if (error) {
      console.error('登录失败:', error);
      const msg = error.message === 'Invalid login credentials'
        ? '账号或密码错误'
        : error.message;
      showError(msg);
      loginBtn.innerText = '登录';
      loginBtn.disabled = false;
    } else {
      // 登录成功，保存 token (如果后端返回了 session)
      if (data.session) {
        localStorage.setItem('admin_token', data.session.access_token);
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
  localStorage.removeItem('admin_token');
  location.reload();
});

function showDashboard() {
  loginModal.style.display = 'none';
  adminDashboard.style.display = 'block';
  loadCategories();
  loadQuestions();
}

function showError(msg) {
  loginError.innerText = msg;
  loginError.style.display = 'block';
}

// ================= 2. 标签页切换 =================
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    tabContents.forEach(t => t.classList.remove('active'));

    btn.classList.add('active');
    const tabId = btn.dataset.tab;
    document.getElementById(`tab-${tabId}`).classList.add('active');

    if (tabId === 'create-q' || tabId === 'category') loadCategories();
    if (tabId === 'list-q') loadQuestions();
  });
});

// ================= 3. 数据加载 =================

async function loadCategories() {
  // ✨ 修复 2: 移除了多余的 await
  const { data, error } = await api.getCategories();

  if (!error) {
    categories = data;
    renderCategorySelect();
    renderCategoriesList();
  }
}

async function loadQuestions() {
  questionsLoader.style.display = 'block';
  // 使用 api 获取数据
  const { data, error } = await api.getQuestions();

  questionsLoader.style.display = 'none';

  if (!error) {
    questions = data;
    renderQuestionsTable();
  }
}

// ================= 4. TAB: 创建题目逻辑 =================

function renderCategorySelect() {
  categorySelect.innerHTML = categories.length === 0
    ? '<option disabled selected>请先去创建类别</option>'
    : categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
}

function renderOptions() {
  const type = document.querySelector('input[name="q-type"]:checked').value;
  const isSingle = type === 'SINGLE_CHOICE';

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

// 保存题目
saveQBtn.addEventListener('click', async () => {
  const category = categorySelect.value;
  const type = document.querySelector('input[name="q-type"]:checked').value;
  const text = qText.value.trim();
  const explanation = qExplanation.value.trim();

  if (!category) return alert('请先选择类别');
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
      type,
      text,
      options: createQOptions,
      correct_option_ids: correctIds,
      explanation,
      created_at: new Date().toISOString()
    };

    // 已正确使用 api.addQuestion
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

// ================= 5. TAB: 题库列表逻辑 =================

function renderQuestionsTable() {
  questionsTableBody.innerHTML = questions.length === 0
    ? '<tr><td colspan="4" style="text-align:center; padding:20px;">暂无题目</td></tr>'
    : questions.map(q => `
            <tr>
                <td>${q.text.substring(0, 20)}...</td>
                <td>${q.category}</td>
                <td>${q.type === 'SINGLE_CHOICE' ? '单选' : '多选'}</td>
                <td class="col-action">
                    <button onclick="deleteQuestion('${q.id}')" title="删除">🗑️</button>
                </td>
            </tr>
        `).join('');
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

// ================= 6. TAB: 创建类别逻辑 =================

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

// ✨ 修复 3: 保存类别 - 替换 supabase.insert 为 api.addCategory
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

// ✨ 修复 4: 删除类别 - 替换 supabase.delete 为 api.deleteCategory，并移除密码验证
window.deleteCategory = async (id) => {
  if (!confirm('⚠️ 警告：删除类别可能会导致该类别下的题目无法显示。\n确定要删除吗？')) return;

  // 已移除密码二次验证，依赖登录状态
  try {
    const { error } = await api.deleteCategory(id);
    if (error) throw error;
    loadCategories();
  } catch (err) {
    alert('删除失败: ' + err.message);
  }
};