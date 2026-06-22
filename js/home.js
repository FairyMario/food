/* ============================================
   首页逻辑
   ============================================ */

let currentView = 'all';   // 'all' | 'district' | 'rating'
let currentStores = [];
let userLocation = null;

/**
 * 加载首页数据
 */
async function loadHome() {
    try {
        const res = await fetch('data/foods.json');
        const data = await res.json();
        setBaseStores(data.stores || []);
        currentStores = getMergedStores();
    } catch (e) {
        console.error('加载数据失败:', e);
        currentStores = [];
    }

    // 尝试获取用户位置
    userLocation = await getUserLocation();

    renderHome();
}

/**
 * 刷新数据（作者修改后调用）
 */
function refreshStores() {
    currentStores = getMergedStores();
    renderHome();
}

/**
 * 渲染首页
 */
function renderHome() {
    const listEl = document.getElementById('home-list');
    const emptyEl = document.getElementById('home-empty');
    const bannerEl = document.getElementById('home-banner');

    // 渲染横幅
    const bannerText = Storage.getBannerText();
    if (bannerText) {
        var style = Storage.getBannerStyle();
        bannerEl.textContent = bannerText;
        bannerEl.style.color = style.color || '#999999';
        bannerEl.style.fontFamily = style.font || 'monospace';
        bannerEl.style.fontSize = 'calc(' + (style.size || '0.82') + 'rem * var(--font-size-multiplier))';
        bannerEl.classList.remove('hidden');
    } else {
        bannerEl.classList.add('hidden');
    }

    if (currentStores.length === 0) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
    }

    emptyEl.classList.add('hidden');

    switch (currentView) {
        case 'all':
            listEl.innerHTML = renderAllView();
            break;
        case 'district':
            listEl.innerHTML = renderDistrictView();
            break;
        case 'rating':
            listEl.innerHTML = renderRatingView();
            break;
    }
}

/**
 * 总览视图 — 按推荐度/时间排序
 */
function renderAllView() {
    const sorted = [...currentStores].sort((a, b) => b.rating - a.rating);
    return sorted.map(store => renderCard(store)).join('');
}

/**
 * 按区域划分视图
 */
function renderDistrictView() {
    const districts = {};
    currentStores.forEach(store => {
        (store.branches || []).forEach(branch => {
            const d = branch.district || '其他';
            if (!districts[d]) districts[d] = new Set();
            districts[d].add(store);
        });
    });

    const order = ['金水区','二七区','中原区','管城回族区','惠济区','郑东新区','高新区','经开区','航空港区','上街区'];
    const sortedDistricts = Object.keys(districts).sort((a, b) => {
        const ai = order.indexOf(a), bi = order.indexOf(b);
        if (ai >= 0 && bi >= 0) return ai - bi;
        if (ai >= 0) return -1;
        if (bi >= 0) return 1;
        return a.localeCompare(b, 'zh');
    });

    let html = '';
    sortedDistricts.forEach(district => {
        html += `<div class="section-title">📍 ${district}</div>`;
        const stores = [...districts[district]].sort((a, b) => b.rating - a.rating);
        stores.forEach(store => {
            html += renderCard(store);
        });
    });
    return html;
}

/**
 * 按推荐星级划分视图
 */
function renderRatingView() {
    const groups = { 5: [], 4: [], 3: [], 2: [], 1: [] };
    currentStores.forEach(store => {
        const r = Math.round(store.rating);
        if (groups[r]) groups[r].push(store);
    });

    let html = '';
    [5, 4, 3, 2, 1].forEach(star => {
        if (groups[star].length === 0) return;
        html += `<div class="section-title">${renderStars(star)}（${groups[star].length}家）</div>`;
        groups[star].forEach(store => {
            html += renderCard(store);
        });
    });
    return html;
}

/**
 * 渲染单张卡片
 */
function renderCard(store) {
    const distanceStr = getNearestDistanceStr(store, userLocation?.lat, userLocation?.lng);
    const tagsHTML = (store.tags || []).slice(0, 3).map(t => `<span class="card-tag">${escapeHTML(t)}</span>`).join('');

    let imageHTML;
    if (store.photos && store.photos.length > 0) {
        imageHTML = `<img class="card-image" src="${escapeHTML(store.photos[0])}" alt="${escapeHTML(store.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="card-image-placeholder" style="display:none;">🍜</div>`;
    } else {
        imageHTML = `<div class="card-image-placeholder">🍜</div>`;
    }

    // 作者模式下显示修改标记
    let authorBadge = '';
    if (isAuthorMode()) {
        const ad = getAuthorData();
        if (ad.addedStores.find(s => s.id === store.id)) {
            authorBadge = '<span class="author-badge added">新增</span>';
        } else if (ad.editedStores[store.id]) {
            authorBadge = '<span class="author-badge edited">已修改</span>';
        } else if (ad.deletedStoreIds.includes(store.id)) {
            authorBadge = '<span class="author-badge deleted">待删除</span>';
        }
    }

    return `
        <div class="food-card" data-store-id="${escapeHTML(store.id)}" onclick="openDetail('${escapeHTML(store.id)}')">
            ${imageHTML}
            <div class="card-body">
                <div class="card-name">${authorBadge}${escapeHTML(store.name)}</div>
                <div class="card-meta">
                    <span class="card-rating">${renderStars(store.rating)}</span>
                    <span class="card-distance">📍 ${distanceStr}</span>
                </div>
                <div class="card-tags">${tagsHTML}</div>
            </div>
        </div>
    `;
}

/**
 * 切换视图
 */
function switchView(view) {
    currentView = view;
    renderHome();
    const labels = { all: '总览', district: '按区域划分', rating: '按推荐星级' };
    document.getElementById('view-switch-text').textContent = labels[view] || '总览';
    document.querySelectorAll('.view-menu-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });
    document.getElementById('view-menu').classList.add('hidden');
}

function toggleViewMenu() {
    const menu = document.getElementById('view-menu');
    menu.classList.toggle('hidden');
}

function refreshHomeWithLocation(loc) {
    if (loc) {
        userLocation = loc;
        renderHome();
    }
}
