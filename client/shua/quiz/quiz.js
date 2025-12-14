import { initTheme, initTransitions } from '../global.js';

initTheme();
initTransitions();

// ================= DOM 元素 =================
const progressBar = document.getElementById('progress-bar');
const quizArea = document.getElementById('quiz-area');
const resultArea = document.getElementById('result-area');

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
const restartBtn = document.getElementById('restart-btn');

// ================= 状态 =================
let quizData = null;
let currentIndex = 0;
let score = 0;
let selectedOptionIds = new Set(); // 当前选中的选项ID集合
let isAnswered = false; // 是否已提交当前题

// ================= 初始化 =================
document.addEventListener('DOMContentLoaded', () => {
  // 1. 读取数据
  const rawData = localStorage.getItem('current_quiz_data');
  if (!rawData) {
    alert("未找到练习数据，请返回首页重新开始");
    window.location.href = 'index.html';
    return;
  }
  quizData = JSON.parse(rawData);

  // 2. 渲染第一题
  renderQuestion();
});

// ================= 核心逻辑 =================

function renderQuestion() {
  const questions = quizData.questions;
  const currentQ = questions[currentIndex];

  // 重置状态
  selectedOptionIds.clear();
  isAnswered = false;
  feedbackArea.style.display = 'none';
  actionBtn.textContent = '提交答案';
  actionBtn.disabled = true; // 初始禁用，直到选择选项
  actionBtn.onclick = submitAnswer;

  // 更新进度条
  const progress = ((currentIndex) / questions.length) * 100;
  progressBar.style.width = `${progress}%`;

  // 更新 Tag 和 计数
  const typeText = currentQ.type === 'SINGLE_CHOICE' ? '单选' : '多选';
  quizTag.textContent = `${currentQ.category} · ${typeText}`;
  quizCounter.textContent = `${currentIndex + 1} / ${questions.length}`;

  // 更新题目
  questionText.textContent = currentQ.text;

  // 生成选项
  optionsList.innerHTML = '';
  currentQ.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span>${opt.text}</span>`; // 用 span 包裹防止图标挤压
    btn.dataset.id = opt.id;

    // 点击事件
    btn.onclick = () => handleOptionClick(opt.id, btn);
    optionsList.appendChild(btn);
  });
}

function handleOptionClick(id, btnElement) {
  if (isAnswered) return; // 锁定后不可点

  const currentQ = quizData.questions[currentIndex];
  const isSingle = currentQ.type === 'SINGLE_CHOICE';

  if (isSingle) {
    // 单选：清空其他，选中当前
    selectedOptionIds.clear();
    selectedOptionIds.add(id);

    // UI 更新
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');
  } else {
    // 多选：切换状态
    if (selectedOptionIds.has(id)) {
      selectedOptionIds.delete(id);
      btnElement.classList.remove('selected');
    } else {
      selectedOptionIds.add(id);
      btnElement.classList.add('selected');
    }
  }

  // 更新提交按钮状态
  actionBtn.disabled = selectedOptionIds.size === 0;

  // 单选体验优化：如果是单选，其实可以点选即提交（可选），这里保持手动提交
}

function submitAnswer() {
  isAnswered = true;
  const currentQ = quizData.questions[currentIndex];
  const correctIds = currentQ.correctOptionIds;

  // 判断对错
  const selectedArray = Array.from(selectedOptionIds);
  // 逻辑：数量一致 且 选中的都在正确答案里
  const isCorrect = selectedArray.length === correctIds.length &&
    selectedArray.every(id => correctIds.includes(id));

  if (isCorrect) score++;

  // --- UI 更新 ---

  // 1. 标记选项颜色
  document.querySelectorAll('.option-btn').forEach(btn => {
    const optId = btn.dataset.id;
    const isSelected = selectedOptionIds.has(optId);
    const isRealCorrect = correctIds.includes(optId);

    // 禁用点击
    btn.disabled = true;

    if (isRealCorrect) {
      // 是正确答案 -> 绿色
      btn.classList.add('correct');
      btn.innerHTML += ' <span>✅</span>';
    } else if (isSelected && !isRealCorrect) {
      // 选了但不是正确答案 -> 红色
      btn.classList.add('wrong');
      btn.innerHTML += ' <span>❌</span>';
    }
  });

  // 2. 显示解析
  explanationText.textContent = currentQ.explanation || "暂无解析";
  feedbackArea.style.display = 'block';

  // 3. 按钮变为“下一题”
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
  const percent = Math.round((score / total) * 100);

  // 填满进度条
  progressBar.style.width = '100%';

  // 隐藏答题区，显示结果区
  quizArea.style.display = 'none';
  resultArea.style.display = 'block';

  finalScorePercent.textContent = `${percent}%`;
  finalScoreText.textContent = `${score} / ${total} 答对`;
}

// 重新开始
restartBtn.addEventListener('click', () => {
  // 重置变量
  currentIndex = 0;
  score = 0;

  // UI 复原
  resultArea.style.display = 'none';
  quizArea.style.display = 'flex'; // flex 布局

  // 重新渲染
  renderQuestion();
});