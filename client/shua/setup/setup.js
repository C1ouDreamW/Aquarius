import { api, initTheme, initTransitions } from '../global.js';

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
  mode: 'SEQUENTIAL',
  type: 'ALL',
  count: 5
};

// 获取 URL 参数并加载数据
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  currentCategoryId = params.get('categoryId');
  currentCategoryName = params.get('categoryName');
  const chapterName = params.get('chapterName');

  if (!currentCategoryName && !currentCategoryId) {
    showError("未找到类别信息，请返回首页重试");
    return;
  }

  await loadCategoryInfo();
  await loadQuestions(chapterName);
});

// 加载类别信息
async function loadCategoryInfo() {
  if (currentCategoryName) return;

  const { data: categories, error } = await api.getCategories();
  if (!error && categories) {
    const cat = categories.find(c => c.id === currentCategoryId);
    if (cat) {
      currentCategoryName = cat.name;
    }
  }
}

// 加载题目数据
async function loadQuestions(chapterName) {
  try {
    // 先获取所有题目，在前端进行筛选
    if (!currentCategoryName) return;

    const { data, error } = await api.getQuestions();

    if (error) throw error;

    // 根据类别和章节筛选题目
    allQuestions = (data || []).filter(q => {
      if (chapterName) {
        // 筛选特定章节的题目
        return q.category === currentCategoryName && q.chapter === chapterName;
      } else {
        // 筛选整个类别的题目（包含所有章节）
        return q.category === currentCategoryName;
      }
    });

    infoBanner.style.display = 'flex';
    infoTextCount.textContent = `该分类已有 ${allQuestions.length} 道题目`;

    if (allQuestions.length === 0) {
      showError("该分类下暂无题目，无法开始练习");
      startBtn.disabled = true;
    } else {
      applyFilters();
    }

  } catch (err) {
    console.error(err);
    showError("加载题目失败");
  }
}

// 模式选择
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    settings.mode = btn.dataset.mode;
  });
});

// 类型选择
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    settings.type = btn.dataset.type;
    applyFilters();
  });
});

// 应用过滤器 & 更新滑动条
function applyFilters() {
  // 过滤题目
  filteredQuestions = allQuestions.filter(q => {
    if (settings.type === 'ALL') return true;
    if (settings.type === 'SINGLE') return q.type === 'single_choice';
    if (settings.type === 'MULTIPLE') return q.type === 'multiple_choice';
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

    // 修正当前选择的数量
    let newCount = Math.min(settings.count, max);
    if (newCount === 0) newCount = 1;
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

// 滑动条拖动
countSlider.addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  settings.count = val;
  countDisplay.textContent = val;
});

// 错误显示
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
}

// 点击开始
startBtn.addEventListener('click', () => {
  if (filteredQuestions.length === 0) return;

  let finalQuestions = [...filteredQuestions];

  // 顺序模式按倒序排列
  if (settings.mode === 'SEQUENTIAL') {
    // 按创建时间倒序排序
    finalQuestions.sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0);
      const dateB = new Date(b.created_at || b.createdAt || 0);
      return dateB - dateA;
    });
  } else if (settings.mode === 'RANDOM') {
    // 随机模式：打乱题目顺序
    finalQuestions = shuffleArray(finalQuestions);
  }

  // 截取数量
  finalQuestions = finalQuestions.slice(0, settings.count);

  // // 随机模式：打乱选项顺序
  // if (settings.mode === 'RANDOM') {
  //   finalQuestions = finalQuestions.map(q => ({
  //     ...q,
  //     options: shuffleArray([...q.options])
  //   }));
  // }

  // 存入 localStorage
  const quizData = {
    questions: finalQuestions,
    settings: settings,
    startTime: Date.now()
  };
  localStorage.setItem('current_quiz_data', JSON.stringify(quizData));

  // 跳转到答题页
  window.location.href = '../quiz/quiz.html';
});

// 工具函数：洗牌算法
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}