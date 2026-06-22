/* ============================================
   搜索页逻辑
   ============================================ */

let searchUserLocation = null;
let currentSearchResults = [];

/**
 * 初始化搜索页
 */
async function initSearch() {
    // 获取用户位置
    searchUserLocation = await getUserLocation();

    // 初始化地图
    await waitForAMap();
    initMap();

    // 在地图上显示所有店铺（使用合并数据）
    const stores = getMergedStores();
    if (stores.length === 0) {
        // 如果还没加载，尝试从 home 获取
        try {
            const res = await fetch('data/foods.json');
            const data = await res.json();
            setBaseStores(data.stores || []);
        } catch (e) {}
    }

    const allStores = getMergedStores();
    if (mapInstance && allStores.length > 0) {
        addStoreMarkers(allStores, (store, branch) => {
            if (store.branches && store.branches.length > 1) {
                showBranchPopup(store);
            } else {
                openDetail(store.id);
            }
        });
        mapFitAll();

        if (searchUserLocation) {
            addUserMarker(searchUserLocation.lat, searchUserLocation.lng);
        }
    }
}

function deinitSearch() {
    destroyMap();
}

/**
 * 搜索逻辑
 */
function performSearch(query) {
    const searchEmpty = document.getElementById('search-empty');
    const branchPopup = document.getElementById('branch-popup');
    const allStores = getMergedStores();

    if (!query || query.trim() === '') {
        currentSearchResults = [];
        searchEmpty.classList.add('hidden');
        branchPopup.classList.add('hidden');

        if (mapInstance) {
            addStoreMarkers(allStores, (store, branch) => {
                if (store.branches && store.branches.length > 1) {
                    showBranchPopup(store);
                } else {
                    openDetail(store.id);
                }
            });
            mapFitAll();
        }
        return;
    }

    const q = query.trim().toLowerCase();
    const results = allStores.filter(store => {
        return store.name.toLowerCase().includes(q) ||
               (store.tags || []).some(t => t.toLowerCase().includes(q)) ||
               (store.branches || []).some(b => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q));
    });

    currentSearchResults = results;

    if (results.length === 0) {
        searchEmpty.classList.remove('hidden');
        branchPopup.classList.add('hidden');
        clearMarkers();
        return;
    }

    searchEmpty.classList.add('hidden');

    addStoreMarkers(results, (store, branch) => {
        if (store.branches && store.branches.length > 1) {
            showBranchPopup(store);
        } else {
            openDetail(store.id);
        }
    });

    if (results.length === 1 && results[0].branches && results[0].branches.length > 1) {
        mapFitAll();
        showBranchPopup(results[0]);
    } else {
        branchPopup.classList.add('hidden');
        mapFitAll();
    }
}

function showBranchPopup(store) {
    const popup = document.getElementById('branch-popup');
    const title = document.getElementById('branch-popup-title');
    const list = document.getElementById('branch-popup-list');

    title.textContent = store.name + ' - 分店列表';

    const sortedBranches = sortBranchesByDistance(
        store.branches,
        searchUserLocation?.lat,
        searchUserLocation?.lng
    );

    let html = '';
    sortedBranches.forEach((branch, index) => {
        let distStr = '未知距离';
        if (searchUserLocation && branch.lat != null && branch.lng != null) {
            const dist = calcDistance(searchUserLocation.lat, searchUserLocation.lng, branch.lat, branch.lng);
            distStr = formatDistance(dist);
        }
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📍';
        html += `
            <div class="branch-item">
                <div class="branch-item-info">
                    <div class="branch-item-name">${medal} ${escapeHTML(branch.name)}</div>
                    <div class="branch-item-address">${escapeHTML(branch.address)}</div>
                    ${branch.openingHours ? `<div class="branch-item-address">🕐 ${escapeHTML(branch.openingHours)}</div>` : ''}
                </div>
                <span class="branch-item-distance">${distStr}</span>
                <button class="branch-nav-btn" onclick="event.stopPropagation();openNavigation(${branch.lat},${branch.lng},'${escapeHTML(branch.name)}')">🧭 导航</button>
            </div>
        `;
    });

    list.innerHTML = html;
    popup.classList.remove('hidden');
}

function closeBranchPopup() {
    document.getElementById('branch-popup').classList.add('hidden');
}

function clearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('search-clear').classList.add('hidden');
    performSearch('');
}
