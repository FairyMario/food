/* ============================================
   应用主逻辑 — Tab 切换、事件绑定、初始化
   ============================================ */

/**
 * Tab 切换
 */
function switchTab(tab) {
    // 更新导航栏
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tab);
    });

    // 更新内容区
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === 'tab-' + tab);
    });

    // 切换处理
    if (tab === 'home') {
        deinitSearch();
        renderHome(); // 刷新首页
    } else if (tab === 'search') {
        initSearch();
    } else if (tab === 'settings') {
        deinitSearch();
        initSettings();
    }

    // 滚动到顶部
    window.scrollTo(0, 0);
}

/**
 * Toast 提示
 */
let toastTimer;
function showToast(message, duration) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.add('hidden');
    }, duration || 2000);
}

/**
 * 确认对话框
 */
let confirmCallback = null;
function showConfirm(message, callback) {
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('confirm-dialog').classList.remove('hidden');
    confirmCallback = callback;
}

function hideConfirm() {
    document.getElementById('confirm-dialog').classList.add('hidden');
    confirmCallback = null;
}

function confirmOk() {
    if (confirmCallback) confirmCallback();
    hideConfirm();
}

/**
 * 点击页面任意处关闭下拉菜单
 */
function handleGlobalClick(e) {
    const menu = document.getElementById('view-menu');
    const btn = document.getElementById('view-switch-btn');
    if (menu && !menu.classList.contains('hidden')) {
        if (!menu.contains(e.target) && !btn.contains(e.target)) {
            menu.classList.add('hidden');
        }
    }

    // 关闭分店弹窗
    const popup = document.getElementById('branch-popup');
    if (popup && !popup.classList.contains('hidden')) {
        if (e.target.classList.contains('branch-popup-overlay')) {
            closeBranchPopup();
        }
    }
}

/* ============================================
   初始化
   ============================================ */

document.addEventListener('DOMContentLoaded', async () => {
    // --- 导航栏点击 ---
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            switchTab(item.dataset.tab);
        });
    });

    // --- 视图切换按钮 ---
    document.getElementById('view-switch-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleViewMenu();
    });

    // --- 下拉菜单项 ---
    document.querySelectorAll('.view-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            switchView(item.dataset.view);
        });
    });

    // --- 全局点击关闭 ---
    document.addEventListener('click', handleGlobalClick);

    // --- 详情页返回 ---
    document.getElementById('detail-back').addEventListener('click', closeDetail);

    // --- 详情页收藏 ---
    document.getElementById('detail-favorite').addEventListener('click', toggleDetailFavorite);

    // --- 搜索输入 ---
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce((e) => {
        const val = e.target.value;
        document.getElementById('search-clear').classList.toggle('hidden', !val);
        performSearch(val);
    }, 300));

    // --- 清除搜索 ---
    document.getElementById('search-clear').addEventListener('click', clearSearch);

    // --- 分店弹窗关闭 ---
    document.getElementById('branch-popup-close').addEventListener('click', closeBranchPopup);
    document.querySelector('.branch-popup-overlay').addEventListener('click', closeBranchPopup);

    // --- 设置项点击 ---
    document.querySelectorAll('.settings-item').forEach(item => {
        item.addEventListener('click', () => {
            handleSettingsAction(item.dataset.action);
        });
    });

    // --- 深色模式开关 ---
    document.getElementById('darkmode-toggle').addEventListener('change', (e) => {
        Storage.setDarkMode(e.target.checked);
        applyTheme();
        updateSettingsCounts();
    });

    // --- 字体大小弹窗 ---
    document.getElementById('fontsize-close').addEventListener('click', hideFontSizeDialog);
    document.querySelectorAll('.fontsize-option').forEach(opt => {
        opt.addEventListener('click', () => {
            setFontSize(opt.dataset.size);
        });
    });
    document.querySelector('#fontsize-dialog .confirm-overlay').addEventListener('click', hideFontSizeDialog);

    // --- 确认对话框 ---
    document.getElementById('confirm-cancel').addEventListener('click', hideConfirm);
    document.getElementById('confirm-ok').addEventListener('click', confirmOk);
    document.querySelector('#confirm-dialog .confirm-overlay').addEventListener('click', hideConfirm);

    // --- 推荐表单 ---
    document.getElementById('recommend-form').addEventListener('submit', submitRecommend);
    document.getElementById('recommend-back').addEventListener('click', closeRecommendPage);

    // --- 初始加载 ---
    restoreAuthorSession();
    await loadHome();
    applyTheme();
    applyFontSize();
    updateSettingsCounts();

    // --- 注册 Service Worker（PWA 离线支持）---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('SW registered'))
            .catch(err => console.warn('SW registration failed:', err));
    }
});
