/* ============================================
   作者模式逻辑
   ============================================ */

const AUTHOR_PASSWORD = '619208';
const AUTHOR_KEY = 'zzfood_author';

let _authorMode = false;
let _baseStores = [];
let _mergedStores = [];

/**
 * 获取完整 author 数据
 */
function getAuthorData() {
    try {
        const raw = localStorage.getItem(AUTHOR_KEY);
        return raw ? JSON.parse(raw) : getDefaultAuthorData();
    } catch (e) {
        return getDefaultAuthorData();
    }
}

function getDefaultAuthorData() {
    return {
        addedStores: [],
        editedStores: {},
        deletedStoreIds: [],
        recommendations: [],
        feedback: [],
    };
}

function saveAuthorData(data) {
    localStorage.setItem(AUTHOR_KEY, JSON.stringify(data));
}

/**
 * 是否处于作者模式
 */
function isAuthorMode() {
    return _authorMode;
}

/**
 * 尝试进入作者模式
 */
function enterAuthorMode(password) {
    if (password === AUTHOR_PASSWORD) {
        _authorMode = true;
        // 将会话状态也存下来，刷新页面后仍保持
        sessionStorage.setItem('zzfood_author_session', 'true');
        return true;
    }
    return false;
}

function exitAuthorMode() {
    _authorMode = false;
    sessionStorage.removeItem('zzfood_author_session');
}

/**
 * 恢复作者会话（页面刷新后）
 */
function restoreAuthorSession() {
    if (sessionStorage.getItem('zzfood_author_session') === 'true') {
        _authorMode = true;
    }
}

/* ============================================
   数据合并：基础数据 + 作者修改
   ============================================ */

/**
 * 设置基础数据
 */
function setBaseStores(stores) {
    _baseStores = stores;
    _mergedStores = buildMergedStores();
}

/**
 * 获取合并后的店铺列表（应用所有增删改）
 */
function getMergedStores() {
    return _mergedStores;
}

function buildMergedStores() {
    const ad = getAuthorData();
    let stores = [..._baseStores];

    // 1. 应用编辑
    stores = stores.map(s => {
        if (ad.editedStores[s.id]) {
            return deepMerge(s, ad.editedStores[s.id]);
        }
        return s;
    });

    // 2. 移除已删除的
    stores = stores.filter(s => !ad.deletedStoreIds.includes(s.id));

    // 3. 添加新增的
    stores = [...stores, ...ad.addedStores];

    return stores;
}

function deepMerge(base, override) {
    const result = { ...base };
    for (const key of Object.keys(override)) {
        if (key === 'branches' || key === 'reviews' || key === 'tags' || key === 'mustTry' || key === 'photos') {
            // 数组直接替换
            result[key] = override[key];
        } else if (typeof override[key] === 'object' && override[key] !== null && !Array.isArray(override[key])) {
            result[key] = deepMerge(result[key] || {}, override[key]);
        } else {
            result[key] = override[key];
        }
    }
    return result;
}

/**
 * 刷新合并数据（修改后调用）
 */
function refreshMergedStores() {
    _mergedStores = buildMergedStores();
}

/* ============================================
   作者操作：增 / 删 / 改
   ============================================ */

/**
 * 添加新店铺
 */
function authorAddStore(storeData) {
    const ad = getAuthorData();
    ad.addedStores.push(storeData);
    saveAuthorData(ad);
    refreshMergedStores();
}

/**
 * 编辑店铺（仅记录差异）
 */
function authorEditStore(storeId, newData) {
    const ad = getAuthorData();

    // 检查是否是新增的店铺
    const addedIdx = ad.addedStores.findIndex(s => s.id === storeId);
    if (addedIdx >= 0) {
        ad.addedStores[addedIdx] = deepMerge(ad.addedStores[addedIdx], newData);
    } else if (!ad.deletedStoreIds.includes(storeId)) {
        // 原始店铺，保存差异
        ad.editedStores[storeId] = deepMerge(ad.editedStores[storeId] || {}, newData);
    }

    saveAuthorData(ad);
    refreshMergedStores();
}

/**
 * 删除店铺
 */
function authorDeleteStore(storeId) {
    const ad = getAuthorData();

    // 如果是新增的店铺，直接从 addedStores 中移除
    const addedIdx = ad.addedStores.findIndex(s => s.id === storeId);
    if (addedIdx >= 0) {
        ad.addedStores.splice(addedIdx, 1);
    } else {
        // 原始店铺，标记为删除
        if (!ad.deletedStoreIds.includes(storeId)) {
            ad.deletedStoreIds.push(storeId);
        }
        // 清除该店铺的编辑记录
        delete ad.editedStores[storeId];
    }

    saveAuthorData(ad);
    refreshMergedStores();
}

/**
 * 取消对某个店铺的所有修改
 */
function authorRevertStore(storeId) {
    const ad = getAuthorData();
    delete ad.editedStores[storeId];
    ad.deletedStoreIds = ad.deletedStoreIds.filter(id => id !== storeId);
    ad.addedStores = ad.addedStores.filter(s => s.id !== storeId);
    saveAuthorData(ad);
    refreshMergedStores();
}

/* ============================================
   用户推荐管理
   ============================================ */

/**
 * 添加用户推荐
 */
function addRecommendation(data) {
    const ad = getAuthorData();
    ad.recommendations.push({
        ...data,
        id: 'rec_' + Date.now(),
        status: 'pending', // pending | approved | rejected
        submittedAt: new Date().toISOString(),
    });
    saveAuthorData(ad);
}

/**
 * 获取所有推荐
 */
function getRecommendations() {
    return getAuthorData().recommendations;
}

/**
 * 审核推荐（通过/拒绝）
 */
function reviewRecommendation(recId, action) {
    const ad = getAuthorData();
    const rec = ad.recommendations.find(r => r.id === recId);
    if (rec) {
        rec.status = action; // 'approved' | 'rejected'
        rec.reviewedAt = new Date().toISOString();
    }
    saveAuthorData(ad);
}

/**
 * 一键发布推荐 — 将推荐转为正式店铺数据
 */
function publishRecommendation(recId) {
    const ad = getAuthorData();
    const rec = ad.recommendations.find(r => r.id === recId);
    if (!rec) return null;

    const storeId = 'store_' + Date.now();
    const newStore = {
        id: storeId,
        name: rec.name,
        category: rec.category || '其他',
        tags: rec.category ? [rec.category] : [],
        rating: 4,
        priceRange: '待补充',
        description: rec.reason || '待补充',
        mustTry: [],
        photos: rec.photos || [],
        tips: '',
        branches: [{
            id: storeId + '_main',
            name: rec.name,
            address: rec.address,
            district: rec.district || '其他',
            lat: rec.lat || 34.7533,
            lng: rec.lng || 113.6654,
            openingHours: '',
            phone: '',
        }],
        reviews: [],
    };

    authorAddStore(newStore);
    reviewRecommendation(recId, 'approved');

    return storeId;
}

/* ============================================
   意见反馈
   ============================================ */

function addFeedback(data) {
    const ad = getAuthorData();
    ad.feedback.push({
        ...data,
        id: 'fb_' + Date.now(),
        submittedAt: new Date().toISOString(),
    });
    saveAuthorData(ad);
}

function getFeedback() {
    return getAuthorData().feedback;
}

/* ============================================
   导出数据
   ============================================ */

/**
 * 生成完整的 foods.json 内容
 */
function exportFoodsJSON() {
    const stores = buildMergedStores();
    return JSON.stringify({
        stores: stores,
        lastUpdated: new Date().toISOString().split('T')[0],
    }, null, 2);
}

/**
 * 下载 JSON 文件
 */
function downloadFoodsJSON() {
    const json = exportFoodsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'foods.json';
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * 获取修改统计
 */
function getAuthorStats() {
    const ad = getAuthorData();
    return {
        added: ad.addedStores.length,
        edited: Object.keys(ad.editedStores).length,
        deleted: ad.deletedStoreIds.length,
        pendingRecommendations: ad.recommendations.filter(r => r.status === 'pending').length,
        totalRecommendations: ad.recommendations.length,
        totalFeedback: ad.feedback.length,
        hasChanges: ad.addedStores.length > 0 ||
                    Object.keys(ad.editedStores).length > 0 ||
                    ad.deletedStoreIds.length > 0,
    };
}

/**
 * 清除所有作者修改
 */
function clearAllAuthorChanges() {
    saveAuthorData(getDefaultAuthorData());
    refreshMergedStores();
}

/* ============================================
   照片处理（base64）
   ============================================ */

/**
 * 读取文件为 base64 data URL
 */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 压缩图片（限制最大尺寸）
 */
function compressImage(file, maxWidth, maxHeight, quality) {
    return new Promise((resolve) => {
        const maxW = maxWidth || 800;
        const maxH = maxHeight || 800;
        const q = quality || 0.7;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let w = img.width, h = img.height;
                if (w > maxW) { h *= maxW / w; w = maxW; }
                if (h > maxH) { w *= maxH / h; h = maxH; }

                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', q));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}
