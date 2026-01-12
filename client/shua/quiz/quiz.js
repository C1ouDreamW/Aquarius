import { initTheme, initTransitions } from '../global.js';

initTheme();
initTransitions();

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

let quizData = null;
let currentIndex = 0;
let score = 0;
let selectedOptionIds = new Set();
let isAnswered = false;

document.addEventListener('DOMContentLoaded', () => {
  const rawData = localStorage.getItem('current_quiz_data');
  if (!rawData) {
    alert("未找到练习数据，请返回首页重新开始");
    window.location.href = 'index.html';
    return;
  }
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
  quizTag.textContent = `${currentQ.category} · ${typeText}`;
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

  if (isCorrect) score++;

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
  currentIndex = 0;
  score = 0;

  resultArea.style.display = 'none';
  quizArea.style.display = 'flex';

  renderQuestion();
});