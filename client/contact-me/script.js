import { showToast } from './toast.js'

const themeBtn = document.getElementById('theme-btn');
const themeIcon = document.getElementById('theme-icon');
const body = document.body;
const sunPath = "M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z";
const moonPath = "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z";
const savedTheme = localStorage.getItem('theme');

const input_name = document.getElementById('input_name');
const input_email = document.getElementById('input_email');
const input_message = document.getElementById('input_message');
const btn = document.getElementById('submit-btn');

if (savedTheme === 'dark') {
  body.classList.add('dark-mode');
  themeIcon.querySelector('path').setAttribute('d', moonPath);
}

themeBtn.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  if (body.classList.contains('dark-mode')) {
    themeIcon.querySelector('path').setAttribute('d', moonPath);
    localStorage.setItem('theme', 'dark');
  } else {
    themeIcon.querySelector('path').setAttribute('d', sunPath);
    localStorage.setItem('theme', 'light');
  }
});

// 提交表单逻辑 

async function submit_btn() {
  const submit_load = {
    name: input_name.value,
    email: input_email.value,
    message: input_message.value,
  };
  if (!submit_load.name || !submit_load.email || !submit_load.message) {
    showToast('请填写必要信息~🤔', 'error');
    return;
  }
  try {
    const res = await fetch("http://localhost:3000/api/connect", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submit_load),
    })
    if (!res.ok) { throw new Error('HTTP错误，状态码：', res.status) };

    const resData = await res.json();
    showToast('发送成功~已经转交给作者啦😽', 'success');
    console.log('提交成功：', resData);
  } catch (err) {
    console.log("fetch出现异常：", err);
    showToast('发送失败！请检查网络连接~😰', 'error');
  }
}

// 增加事件监听函数，因为在html中开启了js文件模块化，导致on_click()无法使用
btn.addEventListener('click', (event) => {
  event.preventDefault();
  submit_btn();
})

// --- 退场动画延迟基本逻辑 ---
document.addEventListener('DOMContentLoaded', () => {
  // 找到页面里所有的链接
  const links = document.querySelectorAll('a');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      const target = link.getAttribute('target');

      // 排除不必要情况：
      // 1. 如果没有链接地址
      // 2. 如果是锚点链接 (#开头)
      // 3. 如果是邮件链接 (mailto:)
      // 4. 如果是新窗口打开 (_blank)
      // 5. 如果是 JavaScript 动作
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:') || target === '_blank') {
        return;
      }

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
