// 全局变量
let currentUser = null;

// DOM元素
const loginPage = document.getElementById('login-page');
const mainPage = document.getElementById('main-page');
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');
const logoutBtn = document.getElementById('logout-btn');
const currentUserSpan = document.getElementById('current-user');
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const refreshBtn = document.getElementById('refresh-btn');
const searchBtn = document.getElementById('search-btn');
const searchInput = document.getElementById('search-input');
const dataTableBody = document.getElementById('data-table-body');
const totalRecords = document.getElementById('total-records');
const todayRecords = document.getElementById('today-records');
const weekRecords = document.getElementById('week-records');

// API基础URL
const API_BASE_URL = '/api';

// 初始化函数
function init() {
    // 检查本地存储中是否有登录状态和令牌
    const savedUser = localStorage.getItem('dbVisualUser');
    const savedToken = localStorage.getItem('authToken');
    if (savedUser && savedToken) {
        currentUser = JSON.parse(savedUser);
        showMainPage();
    }

    // 绑定事件监听器
    bindEventListeners();
}

// 绑定事件监听器
function bindEventListeners() {
    // 登录表单提交
    loginForm.addEventListener('submit', handleLogin);

    // 退出登录
    logoutBtn.addEventListener('click', handleLogout);

    // 导航切换
    navItems.forEach(item => {
        item.addEventListener('click', handleNavClick);
    });

    // 刷新数据
    refreshBtn.addEventListener('click', fetchData);

    // 搜索功能
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

// 处理登录
async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // 调用后端登录API
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            // 保存令牌和用户信息到本地存储
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('dbVisualUser', JSON.stringify(data.user));
            currentUser = data.user;

            showMessage('登录成功', 'success');
            setTimeout(() => {
                showMainPage();
            }, 1000);
        } else {
            showMessage(data.message || '用户名或密码错误', 'error');
        }
    } catch (error) {
        console.error('登录失败:', error);
        showMessage('登录失败，请稍后重试', 'error');
    }
}

// 处理退出登录
function handleLogout() {
    // 清除所有本地存储的认证信息
    localStorage.removeItem('dbVisualUser');
    localStorage.removeItem('authToken');
    currentUser = null;
    showLoginPage();
}

// 处理导航点击
function handleNavClick(e) {
    e.preventDefault();

    // 移除所有活动状态
    navItems.forEach(item => item.classList.remove('active'));
    contentSections.forEach(section => section.classList.remove('active'));

    // 添加当前活动状态
    const targetSection = e.target.dataset.section;
    e.target.classList.add('active');
    document.getElementById(targetSection).classList.add('active');

    // 如果切换到数据列表或概览，刷新数据
    if (targetSection === 'data-list' || targetSection === 'dashboard') {
        fetchData();
    }
}

// 处理搜索
function handleSearch() {
    const searchTerm = searchInput.value.trim();
    fetchData(searchTerm);
}

// 显示消息
function showMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.className = `message ${type}`;

    // 3秒后隐藏消息
    setTimeout(() => {
        loginMessage.textContent = '...';
        loginMessage.className = 'message';
    }, 3000);
}

// 显示登录页面
function showLoginPage() {
    loginPage.classList.add('active');
    mainPage.classList.remove('active');
    loginForm.reset();
    loginMessage.textContent = '...';
    loginMessage.className = 'message';
}

// 显示主页面
function showMainPage() {
    loginPage.classList.remove('active');
    mainPage.classList.add('active');
    currentUserSpan.textContent = `欢迎, ${currentUser.username}`;

    // 加载数据
    fetchData();
}

// 获取数据
async function fetchData(searchTerm = '') {
    try {
        // 显示加载状态
        dataTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;"><div class="loading"></div> 加载中...</td></tr>';

        // 获取存储的令牌
        const token = localStorage.getItem('authToken');

        // 调用API获取数据，带上Authorization头
        const response = await fetch(`${API_BASE_URL}/connect/connect-me?search=${encodeURIComponent(searchTerm)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // 检查响应状态
        if (response.status === 401) {
            // 未授权，跳回登录页
            showMessage('登录已过期，请重新登录', 'error');
            setTimeout(() => {
                handleLogout();
            }, 1500);
            return;
        }

        if (response.status === 403) {
            // 令牌无效
            showMessage('登录已失效，请重新登录', 'error');
            setTimeout(() => {
                handleLogout();
            }, 1500);
            return;
        }

        const data = await response.json();

        if (data.success) {
            // 更新统计数据
            updateStats(data.data);

            // 更新数据列表
            renderDataList(data.data);
        } else {
            dataTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">获取数据失败</td></tr>';
        }
    } catch (error) {
        console.error('获取数据失败:', error);
        dataTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">网络错误，请稍后重试</td></tr>';
    }
}

// 更新统计数据
function updateStats(data) {
    // 总记录数
    totalRecords.textContent = data.length;

    // 今日新增
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = data.filter(item => new Date(item.date) >= today).length;
    todayRecords.textContent = todayCount;

    // 最近7天
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weekCount = data.filter(item => new Date(item.date) >= weekAgo).length;
    weekRecords.textContent = weekCount;
}

// 渲染数据列表
function renderDataList(data) {
    if (data.length === 0) {
        dataTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">暂无数据</td></tr>';
        return;
    }

    const rows = data.map(item => {
        const date = new Date(item.date).toLocaleString('zh-CN');
        return `
            <tr>
                <td>${item._id || 'N/A'}</td>
                <td>${item.name || '未知'}</td>
                <td>${item.email || '未知'}</td>
                <td>${item.message || '无留言'}</td>
                <td>${date}</td>
            </tr>
        `;
    }).join('');

    dataTableBody.innerHTML = rows;
}

// 初始化应用
init();
