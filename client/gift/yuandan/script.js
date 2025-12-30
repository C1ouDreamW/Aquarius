const wheel = document.getElementById('wheel');
const spinBtn = document.getElementById('spinBtn');
const modal = document.getElementById('resultModal');
let isFirst = true;

let currentRotation = 0;

// --- 抽奖逻辑 ---
spinBtn.addEventListener('click', () => {
  spinBtn.disabled = true;
  spinBtn.innerText = "好运加载中...";


  const baseSpins = 8;
  const targetAngle = 210;
  const randomOffset = Math.floor(Math.random() * 40) - 20;

  const rotateAmount = currentRotation + (360 * baseSpins) + (360 - targetAngle) + randomOffset;

  currentRotation = rotateAmount;

  // 执行旋转
  wheel.style.transform = `rotate(${rotateAmount}deg)`;

  setTimeout(() => {
    showResult();
  }, 4000);
});

// --- 显示结果函数 ---
function showResult() {
  if (isFirst) {
    modal.classList.add('show');
    spinBtn.innerText = "新年快乐 ❤️";
  } else {
    spinBtn.disabled = false;
    spinBtn.innerText = "再次回味 ❤️";
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modal = document.getElementById('resultModal');
  const spinBtn = document.getElementById('spinBtn');
  const backHomeBtn = document.getElementById('backHomeBtn');

  console.log('关闭弹窗逻辑初始化');
  console.log('closeModalBtn:', closeModalBtn);
  console.log('modal:', modal);
  console.log('spinBtn:', spinBtn);
  console.log('backHomeBtn:', backHomeBtn);
  console.log('全局变量 - isFirst:', isFirst);

  // 关闭按钮点击事件
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      console.log('关闭按钮被点击');
      modal.classList.remove('show');
      spinBtn.disabled = false;
      spinBtn.innerText = "再次回味 ❤️";
      isFirst = false;
    });
  }

  // 点击弹窗背景关闭事件
  if (modal) {
    modal.addEventListener('click', (e) => {
      console.log('弹窗背景被点击，目标元素:', e.target);
      if (e.target === modal) {
        modal.classList.remove('show');
        spinBtn.disabled = false;
        spinBtn.innerText = "再次回味 ❤️";
        isFirst = false;
      }
    });
  }

  // 返回主页按钮点击事件
  if (backHomeBtn) {
    backHomeBtn.addEventListener('click', () => {
      console.log('返回主页按钮被点击');
      window.location.href = '../../main-page/index.html';
    });
  }

  // 返回上一级按钮点击事件
  const backPrevBtn = document.getElementById('backPrevBtn');
  if (backPrevBtn) {
    backPrevBtn.addEventListener('click', () => {
      console.log('返回上一级按钮被点击');
      window.location.href = '../index.html';
    });
  }
});

