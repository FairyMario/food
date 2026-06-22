/* ============================================
   工具函数
   ============================================ */

/**
 * Haversine 公式计算两点距离（公里）
 */
function calcDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * Math.PI / 180;
}

/**
 * 格式化距离显示
 */
function formatDistance(km) {
    if (km == null || isNaN(km)) return '未知距离';
    if (km < 1) return Math.round(km * 1000) + 'm';
    if (km < 10) return km.toFixed(1) + 'km';
    return Math.round(km) + 'km';
}

/**
 * 获取店铺到用户的最近距离
 */
function getNearestDistance(store, userLat, userLng) {
    if (!store.branches || store.branches.length === 0) return null;
    if (userLat == null || userLng == null) return null;
    let minDist = Infinity;
    for (const branch of store.branches) {
        if (branch.lat != null && branch.lng != null) {
            const dist = calcDistance(userLat, userLng, branch.lat, branch.lng);
            if (dist < minDist) minDist = dist;
        }
    }
    return minDist === Infinity ? null : minDist;
}

function getNearestDistanceStr(store, userLat, userLng) {
    const dist = getNearestDistance(store, userLat, userLng);
    return formatDistance(dist);
}

/**
 * 按用户距离排序分店
 */
function sortBranchesByDistance(branches, userLat, userLng) {
    if (!branches || userLat == null || userLng == null) return branches;
    return [...branches].sort((a, b) => {
        const distA = (a.lat != null && a.lng != null) ? calcDistance(userLat, userLng, a.lat, a.lng) : Infinity;
        const distB = (b.lat != null && b.lng != null) ? calcDistance(userLat, userLng, b.lat, b.lng) : Infinity;
        return distA - distB;
    });
}

/**
 * 评分星星
 */
function renderStars(rating) {
    let html = '';
    for (let i = 0; i < 5; i++) {
        html += i < rating ? '⭐' : '☆';
    }
    return html;
}

/**
 * 防抖
 */
function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

/**
 * HTML 转义
 */
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/* ============================================
   用户定位（纯高德，不用浏览器 GPS）
   浏览器 GPS 底层依赖 Google，国内被墙
   ============================================ */

/**
 * 获取用户位置
 * 策略：高德 CitySearch → 高德 IP JSONP → 郑州兜底
 * @returns {Promise<{lat: number, lng: number}>}
 */
async function getUserLocation() {
    try {
        console.log('📍 开始获取位置...');

        // 等待高德 SDK
        const ready = await waitForAMap();
        console.log('📍 SDK状态:', ready ? '已加载' : '未加载(超时)');

        if (ready) {
            // 方式1：高德 Geolocation 插件（GPS + WiFi + 基站）
            console.log('📍 尝试高德GPS...');
            const geoPos = await tryAmapGeolocation();
            if (geoPos) return geoPos;

            // 方式2：高德 CitySearch（IP → 城市中心）
            console.log('📍 尝试CitySearch...');
            const cityPos = await tryAmapCitySearch();
            if (cityPos) return cityPos;
        }

        // 方式3：高德 IP REST API（JSONP + 重试）
        console.log('📍 尝试IP API...');
        const ipPos = await tryAmapIPJsonp();
        if (ipPos) return ipPos;

    } catch (e) {
        console.log('📍 定位异常:', e.message);
    }

    console.log('📍 使用默认位置：郑州二七广场');
    return { lat: 34.7533, lng: 113.6654 };
}

/**
 * 等待高德 SDK 加载（共享给 map.js 用）
 */
function waitForAMap() {
    return new Promise((resolve) => {
        if (window._amapReady && window.AMap) { resolve(true); return; }
        let ticks = 0;
        const timer = setInterval(() => {
            ticks++;
            if (window._amapReady && window.AMap) {
                clearInterval(timer);
                resolve(true);
            } else if (ticks > 100) {
                clearInterval(timer);
                resolve(false);
            }
        }, 100);
        document.addEventListener('amap-ready', () => {
            clearInterval(timer);
            resolve(true);
        }, { once: true });
    });
}

/**
 * 高德 Geolocation 插件 — GPS + 基站 + WiFi 混合定位，最精确
 * 使用高德自己的定位服务，不依赖 Google
 */
function tryAmapGeolocation() {
    return new Promise((resolve) => {
        if (!window.AMap) { resolve(null); return; }
        try {
            AMap.plugin('AMap.Geolocation', function() {
                var geo = new AMap.Geolocation({
                    enableHighAccuracy: true,   // 高精度（GPS）
                    timeout: 10000,             // 等 10 秒
                    noIpLocate: false,
                    noGeoLocation: false,       // 允许 GPS
                });
                geo.getCurrentPosition(function(status, result) {
                    if (status === 'complete' && result.position) {
                        var lat = result.position.lat;
                        var lng = result.position.lng;
                        var acc = result.accuracy || 0;
                        console.log('📍 高德GPS定位成功 精度:' + Math.round(acc) + 'm');
                        resolve({ lat: lat, lng: lng });
                    } else {
                        console.log('📍 高德GPS未就绪:', status, result.message || '');
                        resolve(null);
                    }
                });
            });
        } catch (e) {
            console.log('📍 GPS插件异常:', e.message);
            resolve(null);
        }
        setTimeout(function() { resolve(null); }, 12000);
    });
}

/**
 * 高德 CitySearch — SDK 自带，IP → 城市中心
 */
function tryAmapCitySearch() {
    return new Promise((resolve) => {
        if (!window.AMap) { resolve(null); return; }
        try {
            AMap.plugin('AMap.CitySearch', function() {
                var citySearch = new AMap.CitySearch();
                citySearch.getLocalCity(function(status, result) {
                    if (status === 'complete' && result.info === 'OK' && result.bounds) {
                        var center = result.bounds.getCenter();
                        console.log('📍 高德定位成功:', result.city || result.province);
                        resolve({ lat: center.lat, lng: center.lng });
                    } else {
                        console.log('📍 CitySearch 返回:', status, result && result.info);
                        resolve(null);
                    }
                });
            });
        } catch (e) {
            console.log('📍 CitySearch 异常:', e.message);
            resolve(null);
        }
        setTimeout(function() { resolve(null); }, 8000);
    });
}

/**
 * 高德 IP REST API — JSONP 方式跨域请求，带重试
 */
function tryAmapIPJsonp(retryCount) {
    var maxRetry = retryCount || 0;
    return new Promise(function(resolve) {
        function doRequest() {
            var cbName = '_amapIpCb_' + Date.now() + '_' + Math.random().toString(36).slice(2);
            var script = document.createElement('script');
            var done = false;

            function cleanup() {
                if (done) return;
                done = true;
                clearTimeout(timer);
                delete window[cbName];
                if (script.parentNode) script.parentNode.removeChild(script);
            }

            var timer = setTimeout(function() {
                cleanup();
                resolve(null);
            }, 5000);

            window[cbName] = function(data) {
                if (done) return;
                if (data && data.status === '1' && data.rectangle && data.rectangle.length > 0) {
                    try {
                        var rectStr = typeof data.rectangle === 'string' ? data.rectangle : '';
                        if (rectStr && rectStr !== '[]') {
                            var parts = rectStr.split(';')[0].split(',');
                            var lng = parseFloat(parts[0]);
                            var lat = parseFloat(parts[1]);
                            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                                console.log('📍 高德 IP API 成功:', data.province || '', data.city || '', '(', lat.toFixed(4) + ',' + lng.toFixed(4) + ')');
                                cleanup();
                                resolve({ lat: lat, lng: lng });
                                return;
                            }
                        }
                    } catch (e) {}
                }
                cleanup();
                // 空数据时重试一次
                if (maxRetry < 1) {
                    maxRetry++;
                    console.log('📍 IP API 重试...');
                    setTimeout(function() { doRequest(); }, 500);
                } else {
                    resolve(null);
                }
            };

            script.onerror = function() {
                cleanup();
                if (maxRetry < 1) {
                    maxRetry++;
                    console.log('📍 IP API 网络错误，重试...');
                    setTimeout(function() { doRequest(); }, 1000);
                } else {
                    resolve(null);
                }
            };

            script.src = 'https://restapi.amap.com/v3/ip?key=2d9d689ea5452c206c7423cf00ffe24f&callback=' + cbName;
            document.head.appendChild(script);
        }

        doRequest();
    });
}
