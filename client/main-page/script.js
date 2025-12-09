const now = new Date()
// 获取元素
const themeBtn = document.getElementById('theme-btn');
const themeIcon = document.getElementById('theme-icon');
const body = document.body;

// 定义svg图标
const sunPath = "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z";
const moonPath = "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z";

// 检查本地存储中是否有用户之前的偏好
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  body.classList.add('dark-mode');
  themeIcon.querySelector('path').setAttribute('d', moonPath);
}

// 点击事件
themeBtn.addEventListener('click', () => {
  body.classList.toggle('dark-mode');

  if (body.classList.contains('dark-mode')) {
    themeIcon.querySelector('path').setAttribute('d', moonPath);
    // 保存偏好到本地存储
    localStorage.setItem('theme', 'dark');
  } else {
    themeIcon.querySelector('path').setAttribute('d', sunPath);
    localStorage.setItem('theme', 'light');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // 找到页面里所有的链接
  const links = document.querySelectorAll('a');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      const target = link.getAttribute('target');

      // 排除情况：
      // 1. 如果没有链接地址
      // 2. 如果是锚点链接 (#开头)
      // 3. 如果是邮件链接 (mailto:)
      // 4. 如果是新窗口打开 (_blank)
      // 5. 如果是 JavaScript 动作
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:') || target === '_blank') {
        return; // 直接放行，不拦截
      }

      // === 核心拦截逻辑 ===
      e.preventDefault(); // 阻止浏览器立即跳转

      // 给 body 加上离场类名，触发 CSS 里的 fadeOutDown 动画
      document.body.classList.add('page-exiting');

      // 等待 500毫秒 (0.5秒) 动画播完，再手动跳转
      setTimeout(() => {
        window.location.href = href;
      }, 500);
    });
  });
});

// 防止浏览器“后退”按钮导致页面卡在空白状态
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    document.body.classList.remove('page-exiting');
  }
});

// -- 检验后端连通性逻辑 --

// async function test_server_link() {
//   try {
//     const response_fetch = await fetch("http://localhost:3000");
//     if (!response_fetch.ok) {
//       throw new Error("HTTP状态码错误：", response_fetch.status);
//     }
//     const response = await response_fetch.json();
//     if (response.success === true) {
//       console.log("连接成功：", response.code || "无状态码");
//     } else {
//       console.log("连接成功，但业务状态失败：", response.message);
//     }

//   } catch (error) {
//     console.log("连接错误：", error);
//   }
// }

// <a href="javascript:void(0);" id="server-test-card" class="card" ... >

async function test_server_link() {
  const card = document.getElementById('server-test-card');
  const iconDiv = card.querySelector('.icon');
  const title = card.querySelector('h3');
  const desc = card.querySelector('p');

  // --- 开始测试 (Loading 状态) ---
  if (card.classList.contains('status-success')) return; // 已经成功了就不让点了

  card.classList.add('status-loading');
  iconDiv.innerHTML = '⏳';
  desc.innerText = "正在呼叫服务器...";

  try {
    const startTime = performance.now();
    // 模拟延迟
    await new Promise(r => setTimeout(r, 800));

    const response_fetch = await fetch("http://localhost:3000");
    const endTime = performance.now();
    const latency = (endTime - startTime).toFixed(0);
    if (!response_fetch.ok) throw new Error("HTTP Error");
    const response = await response_fetch.json();

    if (response.success === true) {
      // --- 成功 (Success 状态) ---
      card.classList.remove('status-loading');
      card.classList.add('status-success');

      // 更改内容
      iconDiv.innerHTML = '✅';
      title.innerText = "连接畅通";
      desc.innerText = `延迟: ${latency}ms (Code: ${response.code})`;

      // 3秒后自动复原
      setTimeout(() => {
        resetCard(card, iconDiv, title, desc);
      }, 3000);
    } else {
      throw new Error(response.message);
    }

  } catch (error) {
    // --- 失败 (Error 状态) ---
    card.classList.remove('status-loading');
    card.classList.add('status-error');
    iconDiv.innerHTML = '❌';
    title.innerText = "连接失败";
    desc.innerText = "请检查后端服务";
    console.error(error);

    // 2秒后复原
    setTimeout(() => {
      resetCard(card, iconDiv, title, desc);
    }, 2000);
  }
}

function resetCard(card, icon, title, desc) {
  card.classList.remove('status-success', 'status-error');
  icon.innerHTML = '🚦';
  title.innerText = "访问后端";
  desc.innerText = "检验后端服务器连通性";
}