// 技术栈数据定义
const techStack = [
  { name: 'Node.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original-wordmark.svg' },
  { name: 'Express', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg' },
  { name: 'MongoDB', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original-wordmark.svg' },
  { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg' },
  { name: 'CSS3', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original-wordmark.svg' },
  { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg' },
  { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg' },
  { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg' },
  { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg' },
  { name: 'Linux', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/linux/linux-original.svg' },
  { name: 'HTML5', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg' },
  { name: 'Go', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original-wordmark.svg' },
  { name: 'C++', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg' },
  { name: 'Ubuntu', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ubuntu/ubuntu-original.svg' },
  { name: 'Godot', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/godot/godot-original.svg' },
  { name: 'github', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg' },
  { name: 'SQLite', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sqlite/sqlite-original-wordmark.svg' },
];

// 渲染技术栈图标函数
function renderTechStack() {
  // 获取所有轨道容器
  const tracks = document.querySelectorAll('.tech-marquee-track');

  // 为每个轨道渲染图标
  tracks.forEach((track, index) => {
    // 获取当前轨道的内容容器
    const content = track.querySelector('.tech-marquee-content');

    // 清空现有内容
    content.innerHTML = '';

    // 创建双重列表：将数组内容重复拼接一遍
    const doubleTechStack = [...techStack, ...techStack];

    // 遍历双重列表，创建图标元素
    doubleTechStack.forEach(tech => {
      // 创建图标容器
      const techItem = document.createElement('div');
      techItem.className = 'tech-item';

      // 创建图标元素
      const techIcon = document.createElement('img');
      techIcon.src = tech.icon;
      techIcon.alt = tech.name;
      techIcon.className = 'tech-icon';

      // 将图标添加到容器中
      techItem.appendChild(techIcon);

      // 将容器添加到轨道内容中
      content.appendChild(techItem);
    });
  });
}

// 页面加载完成后渲染技术栈图标
document.addEventListener('DOMContentLoaded', renderTechStack);