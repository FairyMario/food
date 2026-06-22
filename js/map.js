/* ============================================
   高德地图相关
   ============================================ */

let mapInstance = null;
let mapMarkers = [];
let userMarker = null;

/**
 * 初始化地图
 */
function initMap() {
    if (window._amapReady && window.AMap && !mapInstance) {
        mapInstance = new AMap.Map('map-container', {
            zoom: 12,
            center: [113.6654, 34.7533], // 郑州中心（二七广场）
            resizeEnable: true,
            mapStyle: 'amap://styles/light',
        });
    }
}

// waitForAMap() 定义在 utils.js 中，此处复用

/**
 * 添加店铺标记点
 * @param {Array} stores 店铺数组
 * @param {Function} onClick 点击回调
 */
function addStoreMarkers(stores, onClick) {
    clearMarkers();
    if (!mapInstance) return;

    const allBranches = [];
    stores.forEach(store => {
        (store.branches || []).forEach(branch => {
            if (branch.lat && branch.lng) {
                allBranches.push({
                    store: store,
                    branch: branch,
                    lng: branch.lng,
                    lat: branch.lat,
                });
            }
        });
    });

    allBranches.forEach(({ store, branch }) => {
        const marker = new AMap.Marker({
            position: [branch.lng, branch.lat],
            title: store.name,
            label: {
                content: `<div style="background:#e74c3c;color:#fff;padding:2px 8px;border-radius:12px;font-size:12px;white-space:nowrap;">${store.name}</div>`,
                direction: 'top',
            },
        });

        marker.on('click', () => {
            if (onClick) onClick(store, branch);
        });

        marker.setMap(mapInstance);
        mapMarkers.push(marker);
    });
}

/**
 * 清除所有标记
 */
function clearMarkers() {
    mapMarkers.forEach(m => m.setMap(null));
    mapMarkers = [];
}

/**
 * 添加用户位置标记
 */
function addUserMarker(lat, lng) {
    if (!mapInstance) return;
    if (userMarker) {
        userMarker.setMap(null);
    }
    userMarker = new AMap.Marker({
        position: [lng, lat],
        icon: new AMap.Icon({
            size: new AMap.Size(20, 20),
            image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
            imageSize: new AMap.Size(20, 20),
        }),
        title: '我的位置',
    });
    userMarker.setMap(mapInstance);
}

/**
 * 地图定位到指定坐标
 */
function mapSetCenter(lat, lng, zoom) {
    if (!mapInstance) return;
    mapInstance.setZoomAndCenter(zoom || 15, [lng, lat]);
}

/**
 * 地图自适应显示所有标记
 */
function mapFitAll() {
    if (!mapInstance || mapMarkers.length === 0) return;
    mapInstance.setFitView(null, false, [60, 60, 60, 60]);
}

/**
 * 打开高德导航
 */
function openNavigation(lat, lng, name) {
    const ua = navigator.userAgent.toLowerCase();
    // 尝试唤起高德地图 App
    const url = `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(name)}&mode=car&coordinate=gaode`;
    window.open(url, '_blank');
}

/**
 * 销毁地图
 */
function destroyMap() {
    if (mapInstance) {
        mapInstance.destroy();
        mapInstance = null;
        mapMarkers = [];
        userMarker = null;
    }
}
