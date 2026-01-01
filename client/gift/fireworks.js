class FireworksEffect {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.rockets = [];
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.particleCount = this.isMobile ? 50 : 100; // 移动端减少粒子数量
    this.fireworkInterval = null;
    this.isRunning = false;
    this.animationId = null;

    this.init();
  }

  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'fireworks-canvas';
    this.ctx = this.canvas.getContext('2d');

    // 设置Canvas大小
    this.resizeCanvas();

    // 添加到页面
    document.body.appendChild(this.canvas);

    // 绑定事件处理函数，保存引用以便后续移除
    this.clickHandler = (e) => this.createFirework(e.clientX, e.clientY);

    let lastScrollY = window.scrollY;
    this.scrollHandler = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY) > 100) {
        this.createFirework(
          Math.random() * window.innerWidth,
          Math.random() * window.innerHeight * 0.5
        );
        lastScrollY = currentScrollY;
      }
    };

    // 窗口大小变化时调整Canvas
    this.resizeHandler = () => this.resizeCanvas();

    // 调用自动触发方法
    this.startAutoFireworks();

    // 点击触发
    document.addEventListener('click', this.clickHandler);

    // 滚动触发
    window.addEventListener('scroll', this.scrollHandler);

    // 窗口大小变化时调整Canvas
    window.addEventListener('resize', this.resizeHandler);

    // 开始动画循环
    this.animate();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  startAutoFireworks() {
    if (this.fireworkInterval) return;

    this.isRunning = true;
    // 自动触发烟花
    this.fireworkInterval = setInterval(() => {
      if (this.isRunning) {
        this.createFirework(
          Math.random() * window.innerWidth,
          Math.random() * window.innerHeight * 0.5
        );
      }
    }, Math.random() * 2000 + 1000);
  }

  stopAutoFireworks() {
    this.isRunning = false;
    if (this.fireworkInterval) {
      clearInterval(this.fireworkInterval);
      this.fireworkInterval = null;
    }
  }

  createFirework(x, y) {
    // 创建火箭对象
    // console.log('Creating rocket at', x, y);
    this.rockets.push({
      x: x,
      y: window.innerHeight,
      targetX: x,
      targetY: y,
      speed: 5,
      acceleration: 0.1,
      color: '#feadad90',
      opacity: 1,
      width: this.isMobile ? 1 : 2,
      height: this.isMobile ? 30 : 40
    });
  }

  createParticle(x, y) {
    // 随机方向和速度
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 3;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    // 返回粒子对象
    return {
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      color: this.getRandomColor(),
      life: 1.0,
      decay: Math.random() * 0.03 + 0.01,
      size: this.isMobile ? 2 : 4
    };
  }

  animate() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 更新和绘制火箭
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const rocket = this.rockets[i];

      // 更新火箭速度和位置
      rocket.speed += rocket.acceleration;
      rocket.y -= rocket.speed;

      // 检查火箭是否到达目标位置
      if (rocket.y <= rocket.targetY) {
        for (let j = 0; j < this.particleCount; j++) {
          this.particles.push(this.createParticle(rocket.targetX, rocket.targetY));
        }
        // 移除火箭
        this.rockets.splice(i, 1);
        continue;
      }

      rocket.opacity = Math.min(1, rocket.speed / 10);

      // 绘制火箭轨迹
      this.ctx.save();
      this.ctx.globalAlpha = rocket.opacity;
      this.ctx.strokeStyle = rocket.color;
      this.ctx.lineWidth = rocket.width;
      this.ctx.beginPath();
      this.ctx.moveTo(rocket.x, rocket.y);
      this.ctx.lineTo(rocket.x, rocket.y - rocket.height);
      this.ctx.stroke();
      this.ctx.restore();
    }

    // 更新和绘制粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      // 更新粒子位置
      particle.x += particle.vx;
      particle.y += particle.vy;

      // 添加重力效果
      particle.vy += 0.1;

      // 更新粒子生命周期
      particle.life -= particle.decay;

      // 如果粒子生命周期结束，从数组中移除
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // 绘制粒子辉光效果
      this.ctx.save();

      // 创建径向渐变，实现从中心到边缘的透明度变化
      const gradient = this.ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 1.5
      );

      const brightColor = this.getBrightenedColor(particle.color, 30);

      gradient.addColorStop(0, brightColor + 'FF');
      gradient.addColorStop(0.5, brightColor + '80');
      gradient.addColorStop(1, brightColor + '00');

      // 绘制辉光
      this.ctx.fillStyle = gradient;
      this.ctx.globalAlpha = particle.life;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size * 1.5, 0, Math.PI * 2);
      this.ctx.fill();

      // 绘制粒子主体
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }

    // 继续动画循环
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  getRandomColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#BB8FCE', '#85C1E2', '#F8C471', '#82E0AA'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getBrightenedColor(color, percent) {
    color = color.replace('#', '');

    let r = parseInt(color.substring(0, 2), 16);
    let g = parseInt(color.substring(2, 4), 16);
    let b = parseInt(color.substring(4, 6), 16);

    r = Math.min(255, Math.round(r * (1 + percent / 100)));
    g = Math.min(255, Math.round(g * (1 + percent / 100)));
    b = Math.min(255, Math.round(b * (1 + percent / 100)));

    const toHex = (n) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  // 销毁烟花效果
  destroy() {
    this.stopAutoFireworks();

    // 停止动画循环
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // 移除事件监听器
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler);
    }
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    // 移除Canvas元素
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }

    // 清空粒子数组
    this.particles = [];
  }
}

// 初始化烟花效果
let fireworks;

// 延迟初始化，确保页面完全加载
setTimeout(() => {
  fireworks = new FireworksEffect();
}, 1000);

// 页面可见性变化时优化性能
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    fireworks?.stopAutoFireworks();
  } else {
    fireworks?.startAutoFireworks();
  }
});

// 窗口大小变化时重新初始化
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    fireworks?.destroy();
    fireworks = new FireworksEffect();
  }, 500);
});