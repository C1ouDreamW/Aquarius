import { initTheme, initTransitions } from '../global.js';

initTheme();
initTransitions();

const progressBar = document.getElementById('progress-bar');
const quizArea = document.getElementById('quiz-area');
const resultArea = document.getElementById('result-area');
const backBtn = document.getElementById('back-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

// 题目区域
const quizTag = document.getElementById('quiz-tag');
const quizCounter = document.getElementById('quiz-counter');
const questionText = document.getElementById('question-text');
const optionsList = document.getElementById('options-list');
const feedbackArea = document.getElementById('feedback-area');
const explanationText = document.getElementById('explanation-text');
const actionBtn = document.getElementById('action-btn');

// 结果区域
const finalScorePercent = document.getElementById('final-score-percent');
const finalScoreText = document.getElementById('final-score-text');
const resultCategory = document.getElementById('result-category');
const restartBtn = document.getElementById('restart-btn');
const wrongQuestionsBtn = document.getElementById('wrong-questions-btn');

let quizData = null;
let currentIndex = 0;
let selectedOptionIds = new Set();
let isAnswered = false;
let wrongQuestions = [];
let rightQuestionsID = [];

// 返回按钮事件监听
backBtn.addEventListener('click', () => {
  window.history.back();
});

document.addEventListener('DOMContentLoaded', () => {
  localStorage.removeItem('wrong_quiz_data');
  wrongQuestions = [];
  const rawData = localStorage.getItem('current_quiz_data');
  if (!rawData) {
    alert("未找到练习数据，请返回首页重新开始");
    window.location.href = 'index.html';
    return;
  }
  // 解析 JSON 数据
  quizData = JSON.parse(rawData);
  renderQuestion();
});


function renderQuestion() {
  const questions = quizData.questions;
  const currentQ = questions[currentIndex];

  selectedOptionIds.clear();
  isAnswered = false;
  feedbackArea.style.display = 'none';
  actionBtn.textContent = '提交答案';
  actionBtn.disabled = true;
  actionBtn.onclick = submitAnswer;

  const progress = ((currentIndex) / questions.length) * 100;
  progressBar.style.width = `${progress}%`;

  const typeText = currentQ.type === 'single_choice' ? '单选' : '多选';
  quizTag.textContent = `${currentQ.category} · ${currentQ.chapter} · ${typeText}`;
  quizCounter.textContent = `${currentIndex + 1} / ${questions.length}`;

  questionText.textContent = currentQ.text;

  optionsList.innerHTML = '';
  // 处理选项格式，支持字符串数组和对象数组
  const options = currentQ.options;
  options.forEach((opt, index) => {
    let optionText = '';
    let optionId = '';

    if (typeof opt === 'string') {
      // 字符串格式：直接使用字符串作为文本，生成ID
      optionText = opt;
      optionId = String.fromCharCode(65 + index); // A, B, C, D...
    } else {
      // 对象格式：使用对象的text和id属性
      optionText = opt.text || '';
      optionId = opt.id || String.fromCharCode(65 + index);
    }

    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span>${optionText}</span>`;
    btn.dataset.id = optionId;

    btn.onclick = () => handleOptionClick(optionId, btn);
    optionsList.appendChild(btn);
  });

  // 触发MathJax渲染题目和选项中的公式
  if (window.MathJax) {
    MathJax.typesetPromise([questionText, optionsList]).catch(err => {
      console.error('MathJax渲染错误:', err);
    });
  }

  // 更新导航箭头状态
  updateNavArrows();
}

function handleOptionClick(id, btnElement) {
  if (isAnswered) return;

  const currentQ = quizData.questions[currentIndex];
  const isSingle = currentQ.type === 'single_choice';

  if (isSingle) {
    selectedOptionIds.clear();
    selectedOptionIds.add(id);

    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');
  } else {
    if (selectedOptionIds.has(id)) {
      selectedOptionIds.delete(id);
      btnElement.classList.remove('selected');
    } else {
      selectedOptionIds.add(id);
      btnElement.classList.add('selected');
    }
  }

  actionBtn.disabled = selectedOptionIds.size === 0;

}

function submitAnswer() {
  isAnswered = true;
  const currentQ = quizData.questions[currentIndex];
  // 处理不同的数据结构
  let correctIds = currentQ.correct_option_ids || currentQ.answer;
  // 确保 correctIds 是一个数组
  if (typeof correctIds === 'string') {
    correctIds = [correctIds];
  }
  // 确保 correctIds 至少是一个空数组
  if (!Array.isArray(correctIds)) {
    correctIds = [];
  }
  const selectedArray = Array.from(selectedOptionIds);
  const isCorrect = selectedArray.length === correctIds.length &&
    selectedArray.every(id => correctIds.includes(id));

  if (isCorrect) {
    // 检查是否在错题集中，若存在则将此题从错题集中删除
    // indexOf() 方法返回第一个匹配元素的索引，若不存在则返回 -1
    // wrongQuestions存储的是题目对象，currentQ是当前题目对象
    // 通过对象的id值来查找是否存在于错题集中
    const index = wrongQuestions.findIndex(q => q.id === currentQ.id);
    if (index !== -1) {
      // splice(index, 1) 从 index 开始删除 1 个元素
      wrongQuestions.splice(index, 1);
    }
    // 检查题目是否已经在正确答案集合中
    const isQuestionAlreadyAdded = rightQuestionsID.some(existingQ => {
      return existingQ === currentQ.id;
    });
    // 只有当题目不在正确答案集合中时才添加
    if (!isQuestionAlreadyAdded) {
      rightQuestionsID.push(currentQ.id);

    }
  } else {
    // 检查是否在正确集中，若存在则将此题从正确集中删除
    const index = rightQuestionsID.indexOf(currentQ.id);
    if (index !== -1) {
      // splice(index, 1) 从 index 开始删除 1 个元素
      rightQuestionsID.splice(index, 1);
    }

    // 检查题目是否已经在错题集合中
    const isQuestionAlreadyAdded = wrongQuestions.some(existingQ => {
      return existingQ.id === currentQ.id;
    });
    // 只有当题目不在错题集合中时才添加
    if (!isQuestionAlreadyAdded) {
      // 收集错误题目
      wrongQuestions.push(JSON.parse(JSON.stringify(currentQ)));
    }
  }

  document.querySelectorAll('.option-btn').forEach(btn => {
    const optId = btn.dataset.id;
    const isSelected = selectedOptionIds.has(optId);
    const isRealCorrect = correctIds.includes(optId);

    btn.disabled = true;

    if (isRealCorrect) {
      btn.classList.add('correct');
      btn.innerHTML += ' <span>✅</span>';
    } else if (isSelected && !isRealCorrect) {
      btn.classList.add('wrong');
      btn.innerHTML += ' <span>❌</span>';
    }
  });

  explanationText.textContent = currentQ.explanation || "暂无解析";
  feedbackArea.style.display = 'block';

  // 触发MathJax渲染解析中的公式
  if (window.MathJax) {
    MathJax.typesetPromise([explanationText]).catch(err => {
      console.error('MathJax渲染错误:', err);
    });
  }

  const isLast = currentIndex === quizData.questions.length - 1;
  actionBtn.textContent = isLast ? '查看结果' : '下一题 ➡️';
  actionBtn.onclick = isLast ? showResults : nextQuestion;
}

function nextQuestion() {
  currentIndex++;
  renderQuestion();
}

function showResults() {
  const total = quizData.questions.length;
  const score = rightQuestionsID.length;
  const percent = Math.round((score / total) * 100);

  // 填满进度条
  progressBar.style.width = '100%';

  // 隐藏答题区，显示结果区
  quizArea.style.display = 'none';
  resultArea.style.display = 'block';

  // 判断是否有错题
  if (wrongQuestions.length > 0) {
    wrongQuestionsBtn.textContent = '📝进入错题集';
    wrongQuestionsBtn.style.backgroundColor = '#ff6b6b';
    wrongQuestionsBtn.disabled = false;
  } else {
    wrongQuestionsBtn.textContent = '✔️暂无错题';
    wrongQuestionsBtn.style.backgroundColor = 'gray';
    // 变为不可点击
    wrongQuestionsBtn.disabled = true;
  }

  // 显示类别和章节信息
  if (quizData.questions.length > 0) {
    const firstQuestion = quizData.questions[0];
    resultCategory.textContent = `${firstQuestion.category} · ${firstQuestion.chapter}`;
  }

  finalScorePercent.textContent = `${percent}%`;
  finalScoreText.textContent = `${score} / ${total} 答对`;

  // 存储错误题目到localStorage
  if (wrongQuestions.length > 0) {
    const wrongQuizData = {
      questions: wrongQuestions
    };
    localStorage.setItem('wrong_quiz_data', JSON.stringify(wrongQuizData));
  } else {
    // 如果没有错误题目，清空存储
    localStorage.removeItem('wrong_quiz_data');
  }
}

// 重新开始
restartBtn.addEventListener('click', () => {
  currentIndex = 0;
  wrongQuestions = [];
  rightQuestionsID = [];
  localStorage.removeItem('wrong_quiz_data');
  resultArea.style.display = 'none';
  quizArea.style.display = 'flex';
  renderQuestion();
});

wrongQuestionsBtn.addEventListener('click', () => {
  currentIndex = 0;
  resultArea.style.display = 'none';
  quizArea.style.display = 'flex';
  rightQuestionsID = [];
  const rawData = localStorage.getItem('wrong_quiz_data');
  if (!rawData) {
    alert(`未找到错误练习数据，错题数为${wrongQuestions.length}`);
    return;
  }
  localStorage.removeItem('wrong_quiz_data');
  wrongQuestions = [];
  // 解析 JSON 数据
  quizData = JSON.parse(rawData);
  renderQuestion();
});

// 更新导航箭头状态
function updateNavArrows() {
  if (!quizData) return;
  const totalQuestions = quizData.questions.length;
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === totalQuestions - 1;
}

// 导航箭头事件监听
prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
});

nextBtn.addEventListener('click', () => {
  if (currentIndex < quizData.questions.length - 1) {
    currentIndex++;
    renderQuestion();
  }
});

// 移动端滑动手势支持
let touchStartX = 0;
let touchCurrentX = 0;
const SWIPE_THRESHOLD = 50; // 滑动阈值
let isDragging = false;

quizArea.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
  touchCurrentX = touchStartX;
  isDragging = true;
  // 清除任何现有的过渡效果
  quizArea.style.transition = 'none';
});

quizArea.addEventListener('touchmove', (e) => {
  if (!isDragging) return;

  touchCurrentX = e.changedTouches[0].screenX;
  const distance = touchCurrentX - touchStartX;

  // 实时更新卡片位置
  quizArea.style.transform = `translateX(${distance}px)`;
  quizArea.style.opacity = 1 - Math.abs(distance) / 300;
});

quizArea.addEventListener('touchend', (e) => {
  if (!isDragging) return;

  isDragging = false;
  const swipeDistance = touchCurrentX - touchStartX;

  // 重置过渡效果
  quizArea.style.transition = 'transform 0.3s ease, opacity 0.3s ease';

  // 向右滑动（上一题）
  if (swipeDistance > SWIPE_THRESHOLD && currentIndex > 0) {
    // 1. 当前卡片向右滑出
    quizArea.style.transform = 'translateX(100%)';
    quizArea.style.opacity = 0;

    // 2. 等待滑出动画完成后，加载新题目并从左侧滑入
    setTimeout(() => {
      currentIndex--;
      renderQuestion();

      // 重置过渡效果
      quizArea.style.transition = 'none';
      // 新卡片初始位置在左侧
      quizArea.style.transform = 'translateX(-100%)';
      quizArea.style.opacity = 0;

      // 触发回流
      void quizArea.offsetWidth;

      // 启用过渡并执行滑入动画
      quizArea.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      quizArea.style.transform = 'translateX(0)';
      quizArea.style.opacity = 1;
    }, 300);
  }
  // 向左滑动（下一题）
  else if (swipeDistance < -SWIPE_THRESHOLD && currentIndex < quizData.questions.length - 1) {
    // 1. 当前卡片向左滑出
    quizArea.style.transform = 'translateX(-100%)';
    quizArea.style.opacity = 0;

    // 2. 等待滑出动画完成后，加载新题目并从右侧滑入
    setTimeout(() => {
      currentIndex++;
      renderQuestion();

      // 重置过渡效果
      quizArea.style.transition = 'none';
      // 新卡片初始位置在右侧
      quizArea.style.transform = 'translateX(100%)';
      quizArea.style.opacity = 0;

      // 触发回流
      void quizArea.offsetWidth;

      // 启用过渡并执行滑入动画
      quizArea.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
      quizArea.style.transform = 'translateX(0)';
      quizArea.style.opacity = 1;
    }, 300);
  }
  // 未达到阈值，回弹
  else {
    quizArea.style.transform = 'translateX(0)';
    quizArea.style.opacity = 1;
  }
});