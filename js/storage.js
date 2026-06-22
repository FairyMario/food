/* ============================================
   localStorage 封装
   ============================================ */

const STORAGE_KEYS = {
    FAVORITES: 'zzfood_favorites',
    HISTORY: 'zzfood_history',
    DARK_MODE: 'zzfood_darkmode',
    FONT_SIZE: 'zzfood_fontsize',
    NICKNAME: 'zzfood_nickname',
    BANNER_TEXT: 'zzfood_banner',
};

const Storage = {
    /**
     * 获取收藏列表
     * @returns {string[]} 店铺 ID 数组
     */
    getFavorites() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.FAVORITES);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * 添加收藏
     */
    addFavorite(storeId) {
        const list = this.getFavorites();
        if (!list.includes(storeId)) {
            list.unshift(storeId);
            localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(list));
        }
    },

    /**
     * 取消收藏
     */
    removeFavorite(storeId) {
        const list = this.getFavorites().filter(id => id !== storeId);
        localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(list));
    },

    /**
     * 是否已收藏
     */
    isFavorite(storeId) {
        return this.getFavorites().includes(storeId);
    },

    /**
     * 切换收藏状态，返回新状态
     */
    toggleFavorite(storeId) {
        if (this.isFavorite(storeId)) {
            this.removeFavorite(storeId);
            return false;
        } else {
            this.addFavorite(storeId);
            return true;
        }
    },

    /**
     * 获取收藏数量
     */
    getFavoritesCount() {
        return this.getFavorites().length;
    },

    /**
     * 获取浏览历史
     * @returns {Array<{id: string, time: number}>}
     */
    getHistory() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    },

    /**
     * 添加浏览历史
     */
    addHistory(storeId) {
        const list = this.getHistory().filter(item => item.id !== storeId);
        list.unshift({ id: storeId, time: Date.now() });
        // 最多保留 50 条
        if (list.length > 50) list.pop();
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(list));
    },

    /**
     * 获取浏览历史数量
     */
    getHistoryCount() {
        return this.getHistory().length;
    },

    /**
     * 清空浏览历史
     */
    clearHistory() {
        localStorage.removeItem(STORAGE_KEYS.HISTORY);
    },

    /**
     * 获取深色模式设置
     */
    getDarkMode() {
        try {
            return localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true';
        } catch (e) {
            return false;
        }
    },

    /**
     * 设置深色模式
     */
    setDarkMode(enabled) {
        localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(enabled));
    },

    /**
     * 获取字体大小
     */
    getFontSize() {
        try {
            return localStorage.getItem(STORAGE_KEYS.FONT_SIZE) || 'medium';
        } catch (e) {
            return 'medium';
        }
    },

    /**
     * 设置字体大小
     */
    setFontSize(size) {
        localStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);
    },

    /**
     * 获取昵称
     */
    getNickname() {
        try {
            return localStorage.getItem(STORAGE_KEYS.NICKNAME) || '';
        } catch (e) { return ''; }
    },

    /**
     * 设置昵称
     */
    setNickname(name) {
        localStorage.setItem(STORAGE_KEYS.NICKNAME, name);
    },

    /**
     * 获取首页横幅文字
     */
    getBannerText() {
        try {
            return localStorage.getItem(STORAGE_KEYS.BANNER_TEXT) || '';
        } catch (e) { return ''; }
    },

    /**
     * 设置首页横幅文字
     */
    setBannerText(text) {
        localStorage.setItem(STORAGE_KEYS.BANNER_TEXT, text);
    },

    /**
     * 获取横幅样式
     */
    getBannerStyle() {
        try {
            var raw = localStorage.getItem('zzfood_banner_style');
            return raw ? JSON.parse(raw) : { color: '#999999', font: 'monospace', size: '0.82' };
        } catch (e) { return { color: '#999999', font: 'monospace', size: '0.82' }; }
    },

    /**
     * 设置横幅样式
     */
    setBannerStyle(style) {
        localStorage.setItem('zzfood_banner_style', JSON.stringify(style));
    },

    /**
     * 清除所有缓存（保留收藏和昵称）
     */
    clearAll() {
        localStorage.removeItem(STORAGE_KEYS.HISTORY);
        // 保留：收藏、深色模式、字体大小、昵称、横幅设置
    }
};
