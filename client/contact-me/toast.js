// Toast提示
/**
 * @param {string} message - 要显示的文字
 * @param {string} type - 类型：'success' (成功) 或 'error' (失败)
 */

// showToast(弹窗信息,success/error)
export function showToast(message, type = 'success') {
  // 创建元素
  const toast = document.createElement('div');
  toast.className = `toast-message toast-${type}`;
  const icon = type === 'success' ? '✅' : '❌';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  document.body.appendChild(toast);

  // 延迟加入 展示动画效果
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // 3秒后自动移除
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 500);
  }, 3000);
}