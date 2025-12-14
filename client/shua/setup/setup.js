import { api, initTheme, initTransitions } from './global.js';

initTheme();
initTransitions();

// 获取 DOM 元素
const categoryTitle = document.getElementById('category-title');
const infoBanner = document.getElementById('info-banner');
const infoTextCount = document.getElementById('info-text-count');
const startBtn = document.getElementById('start-btn');
const countSlider = document.getElementById('count-slider');
const countDisplay = document.getElementById('count-display');
const maxCountHint = document.getElementById('max-count-hint');
const sliderMaxLabel = document.getElementById('slider-max-label');
const errorMsg = document.getElementById('error-msg');
const filterHint = document.getElementById('filter-hint');

// 状态
let currentCategoryId = null;
let currentCategoryName = '';
let allQuestions = []; // 该类别的所有题目
let filteredQuestions = []; // 经过类型筛选后的题目
let settings = {
  mode: 'SEQUENTIAL', // SEQUENTIAL | RANDOM
  type: 'ALL',        // ALL | SINGLE | MULTIPLE
  count: 5
};

// 1. 初始化：获取 URL 参数并加载数据
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  currentCategoryId = params.get('categoryId');

  if (!currentCategoryId) {
    showError("未找到类别 ID，请返回首页重试");
    return;
  }

  await loadCategoryInfo();
  await loadQuestions();
});

// 2. 加载类别信息
async function loadCategoryInfo() {
  const { data: categories, error } = await api.getCategories();
  if (!error && categories) {
    const cat = categories.find(c => c.id === currentCategoryId);
    if (cat) {
      currentCategoryName = cat.name;
    }
  }
}

// 3. 加载题目数据
async function loadQuestions() {
  try {
    // 先获取所有题目，在前端进行筛选（如果数据量不大）
    // 这里使用 categoryName 来查询，因为原项目结构 questions 表存的是 category 的名字
    if (!currentCategoryName) return;

    const { data, error } = await api.getQuestions(currentCategoryName);

    if (error) throw error;

    allQuestions = data || [];

    // 更新 UI
    infoBanner.style.display = 'flex';
    infoTextCount.textContent = `该分类已有 ${allQuestions.length} 道题目`;

    if (allQuestions.length === 0) {
      showError("该分类下暂无题目，无法开始练习");
      startBtn.disabled = true;
    } else {
      applyFilters(); // 初始化过滤器
    }

  } catch (err) {
    console.error(err);
    showError("加载题目失败");
  }
}

// 4. 交互逻辑：模式选择
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    settings.mode = btn.dataset.mode;
  });
});

// 5. 交互逻辑：类型选择
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    settings.type = btn.dataset.type;
    applyFilters(); // 类型变了，可用题目数量也会变
  });
});

// 6. 核心逻辑：应用过滤器 & 更新滑动条
function applyFilters() {
  // 过滤题目
  filteredQuestions = allQuestions.filter(q => {
    if (settings.type === 'ALL') return true;
    if (settings.type === 'SINGLE') return q.type === 'SINGLE_CHOICE';
    if (settings.type === 'MULTIPLE') return q.type === 'MULTIPLE_CHOICE';
    return true;
  });

  const max = filteredQuestions.length;

  // 更新提示文字
  if (settings.type !== 'ALL') {
    filterHint.textContent = `已筛选到 ${max} 道题目（总共 ${allQuestions.length} 道）`;
  } else {
    filterHint.textContent = '';
  }

  // 更新滑动条状态
  if (max === 0) {
    countSlider.disabled = true;
    startBtn.disabled = true;
    showError("当前筛选条件下没有可用题目");
    updateSliderUI(0, 0);
  } else {
    countSlider.disabled = false;
    startBtn.disabled = false;
    errorMsg.style.display = 'none';

    // 修正当前选择的数量（不能超过最大值）
    let newCount = Math.min(settings.count, max);
    if (newCount === 0) newCount = 1; // 至少1道
    settings.count = newCount;

    updateSliderUI(newCount, max);
  }
}

function updateSliderUI(val, max) {
  countSlider.max = max;
  countSlider.value = val;
  countDisplay.textContent = val;
  maxCountHint.textContent = `(最多 ${max} 道)`;
  sliderMaxLabel.textContent = max;
}

// 7. 交互逻辑：滑动条拖动
countSlider.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  settings.count = val;
  countDisplay.textContent = val;
});

// 8. 错误显示
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
}

// 9. 点击开始：生成试卷并跳转
startBtn.addEventListener('click', () => {
  if (filteredQuestions.length === 0) return;

  // 准备题目逻辑 (洗牌 / 截取)
  let finalQuestions = [...filteredQuestions];

  if (settings.mode === 'RANDOM') {
    finalQuestions = shuffleArray(finalQuestions);
  }

  // 截取数量
  finalQuestions = finalQuestions.slice(0, settings.count);

  // 如果是随机模式，把选项也打乱 (可选，原版有这个功能)
  if (settings.mode === 'RANDOM') {
    finalQuestions = finalQuestions.map(q => ({
      ...q,
      options: shuffleArray([...q.options]) // 注意要浅拷贝一下
    }));
  }

  // 存入 localStorage (因为 URL 传参太长了)
  const quizData = {
    questions: finalQuestions,
    settings: settings,
    startTime: Date.now()
  };
  localStorage.setItem('current_quiz_data', JSON.stringify(quizData));

  // 跳转到答题页
  window.location.href = 'quiz.html';
});

// 工具函数：洗牌算法
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}