/* ============================================
   个人设置页逻辑
   ============================================ */

function initSettings() {
    applyTheme();
    applyFontSize();
    updateSettingsCounts();
    updateAuthorEntry();
}

function updateSettingsCounts() {
    const favCount = document.getElementById('favorites-count');
    const histCount = document.getElementById('history-count');
    const darkStatus = document.getElementById('darkmode-status');
    const fontStatus = document.getElementById('fontsize-status');
    const darkToggle = document.getElementById('darkmode-toggle');

    if (favCount) favCount.textContent = Storage.getFavoritesCount() + ' 家店铺';
    if (histCount) histCount.textContent = Storage.getHistoryCount() + ' 条记录';
    if (darkStatus) darkStatus.textContent = Storage.getDarkMode() ? '已开启' : '已关闭';
    if (darkToggle) darkToggle.checked = Storage.getDarkMode();

    const fontSize = Storage.getFontSize();
    const labels = { small: '小', medium: '标准', large: '大' };
    if (fontStatus) fontStatus.textContent = labels[fontSize] || '标准';

    // 昵称
    const nickDisplay = document.getElementById('nickname-display');
    if (nickDisplay) {
        var n = Storage.getNickname();
        nickDisplay.textContent = n || '未设置';
    }

    // 更新作者模式入口
    updateAuthorEntry();
}

function updateAuthorEntry() {
    const entry = document.getElementById('author-entry');
    if (!entry) return;
    if (isAuthorMode()) {
        entry.querySelector('.settings-label').textContent = '🔧 作者管理';
        entry.querySelector('.settings-desc').textContent = '已进入作者模式';
        entry.querySelector('.settings-desc').style.color = 'var(--accent)';
    } else {
        entry.querySelector('.settings-label').textContent = '🔐 作者模式';
        entry.querySelector('.settings-desc').textContent = '输入密码进入管理';
        entry.querySelector('.settings-desc').style.color = '';
    }
}

function handleSettingsAction(action) {
    switch (action) {
        case 'nickname': showNicknamePrompt(); break;
        case 'recommend': openRecommendPage(); break;
        case 'favorites': openSublistPage('favorites'); break;
        case 'history': openSublistPage('history'); break;
        case 'darkmode': break; // 由 toggle 开关的 change 事件处理
        case 'fontsize': showFontSizeDialog(); break;
        case 'clearcache': confirmClearCache(); break;
        case 'feedback': openFeedback(); break;
        case 'about': openAboutPage(); break;
        case 'author': handleAuthorAction(); break;
    }
}

function showNicknamePrompt() {
    var current = Storage.getNickname();
    var name = prompt('请输入你的昵称（评价和推荐时使用）：', current);
    if (name !== null) {
        Storage.setNickname(name.trim());
        updateSettingsCounts();
        showToast(name.trim() ? '昵称已设置 ✅' : '昵称已清除');
    }
}

/* --- 作者模式入口 --- */

function handleAuthorAction() {
    if (isAuthorMode()) {
        openAuthorDashboard();
    } else {
        showAuthorPasswordPrompt();
    }
}

function showAuthorPasswordPrompt() {
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
        <div class="confirm-overlay"></div>
        <div class="confirm-content">
            <h3>🔐 输入作者密码</h3>
            <input type="password" id="author-password-input" class="form-input" placeholder="请输入密码" style="margin-bottom:16px;text-align:center;">
            <div class="confirm-buttons">
                <button id="author-pw-cancel" class="confirm-btn cancel">取消</button>
                <button id="author-pw-ok" class="confirm-btn ok">确认</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);

    const input = dialog.querySelector('#author-password-input');
    const close = () => dialog.remove();

    dialog.querySelector('.confirm-overlay').addEventListener('click', close);
    dialog.querySelector('#author-pw-cancel').addEventListener('click', close);
    dialog.querySelector('#author-pw-ok').addEventListener('click', () => {
        const success = enterAuthorMode(input.value);
        if (success) {
            close();
            showToast('✅ 已进入作者模式');
            updateAuthorEntry();
            refreshStores();
            renderHome();
        } else {
            showToast('❌ 密码错误');
        }
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') dialog.querySelector('#author-pw-ok').click();
    });
    setTimeout(() => input.focus(), 100);
}

/* --- 作者管理面板 --- */

function openAuthorDashboard() {
    // 清理已有子页面
    const existing = document.querySelector('.sublist-page');
    if (existing) existing.remove();

    const page = document.createElement('div');
    page.className = 'detail-page sublist-page';
    page.innerHTML = `
        <div class="subpage-content">
            <div class="detail-header">
                <button class="detail-back" onclick="closeSubPage();updateSettingsCounts();">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <h2 class="detail-title">🔧 作者管理</h2>
                <button class="detail-back" onclick="exitAuthorMode();closeSubPage();refreshStores();renderHome();updateSettingsCounts();showToast('已退出作者模式');" style="font-size:0.7rem;width:auto;padding:0 10px;border-radius:12px;">退出</button>
            </div>
            <div class="author-dashboard">
                <div class="author-tabs" id="author-tabs">
                    <button class="author-tab active" data-tab="manage">📋 美食管理</button>
                    <button class="author-tab" data-tab="add">➕ 新增店铺</button>
                    <button class="author-tab" data-tab="recommendations">📨 用户推荐<span id="auth-rec-badge" class="auth-badge"></span></button>
                    <button class="author-tab" data-tab="feedback">📧 意见反馈<span id="auth-fb-badge" class="auth-badge"></span></button>
                    <button class="author-tab" data-tab="siteconfig">⚙️ 站点设置</button>
                <button class="author-tab" data-tab="export">💾 导出数据</button>
                </div>
                <div class="author-tab-content" id="author-tab-content"></div>
            </div>
        </div>
    `;
    document.body.appendChild(page);

    // Tab 切换
    page.querySelectorAll('.author-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            page.querySelectorAll('.author-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderAuthorTab(tab.dataset.tab);
        });
    });

    renderAuthorTab('manage');
    showSubPage(page.querySelector('.subpage-content'));
}

function renderAuthorTab(tabName) {
    const container = document.getElementById('author-tab-content');
    switch (tabName) {
        case 'manage': container.innerHTML = renderAuthorManageTab(); break;
        case 'add': container.innerHTML = renderAuthorAddTab(); break;
        case 'recommendations': container.innerHTML = renderAuthorRecTab(); break;
        case 'feedback': container.innerHTML = renderAuthorFeedbackTab(); markFeedbackRead(); updateAuthorBadges(); break;
        case 'siteconfig': container.innerHTML = renderSiteConfigTab(); initBannerPreview(); break;
        case 'export': container.innerHTML = renderAuthorExportTab(); break;
    }
    // 更新徽章
    updateAuthorBadges();
}

/* --- 管理 Tab：店铺列表 --- */

function renderAuthorManageTab() {
    const stores = getMergedStores();
    if (stores.length === 0) return '<div class="empty-state"><div class="empty-icon">📋</div><p>暂无店铺数据</p></div>';

    const stats = getAuthorStats();
    let html = '<div class="author-stats">';
    if (stats.hasChanges) {
        html += `<div class="author-stat-warn">⚠️ 有未导出的修改：${stats.added}新增 ${stats.edited}修改 ${stats.deleted}删除</div>`;
    }
    html += '</div>';

    html += '<div class="author-store-list">';
    stores.forEach(store => {
        const ad = getAuthorData();
        let status = '';
        if (ad.addedStores.find(s => s.id === store.id)) status = '<span class="author-badge added">新增</span>';
        else if (ad.editedStores[store.id]) status = '<span class="author-badge edited">已修改</span>';

        html += `
            <div class="author-store-item">
                <div class="author-store-info" onclick="closeSubPage();openDetail('${store.id}')">
                    <span>${status} <strong>${escapeHTML(store.name)}</strong></span>
                    <span style="color:var(--text-muted);font-size:0.78rem;">${renderStars(store.rating)} · ${escapeHTML(store.category || '')}</span>
                </div>
                <div class="author-store-actions">
                    <button class="author-action-btn edit" onclick="event.stopPropagation();openAuthorEditStore('${store.id}')">✏️</button>
                    <button class="author-action-btn delete" onclick="event.stopPropagation();authorDeleteFromDashboard('${store.id}')">🗑️</button>
                </div>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

function openAuthorEditStore(storeId) {
    closeSubPage();
    // 先打开详情页，再触发编辑
    openDetail(storeId);
    setTimeout(() => openEditForm(), 300);
}

function authorDeleteFromDashboard(storeId) {
    const store = findStoreById(storeId);
    showConfirm('确定删除「' + (store?.name || '') + '」吗？（导出数据后生效）', () => {
        authorDeleteStore(storeId);
        refreshStores();
        renderHome();
        renderAuthorTab('manage');
        showToast('已标记删除');
    });
}

/* --- 新增 Tab --- */

function renderAuthorAddTab() {
    return `
        <form id="author-add-form" class="recommend-form" onsubmit="submitAuthorAdd(event)" style="padding:0;">
            <div class="form-group">
                <label class="form-label">店铺名称 <span class="required">*</span></label>
                <input type="text" name="name" class="form-input" placeholder="输入店铺名称" required>
            </div>
            <div class="form-group">
                <label class="form-label">标签（逗号分隔）</label>
                <input type="text" name="tags" class="form-input" placeholder="如：胡辣汤，老字号，清真">
            </div>
            <div class="form-group">
                <label class="form-label">推荐星级</label>
                <input type="number" name="rating" class="form-input" min="1" max="5" value="4">
            </div>
            <div class="form-group">
                <label class="form-label">人均价格</label>
                <input type="text" name="priceRange" class="form-input" placeholder="如：15-30元">
            </div>
            <div class="form-group">
                <label class="form-label">店铺介绍</label>
                <textarea name="description" class="form-input form-textarea" rows="3" placeholder="描述这家店..."></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">必点推荐（逗号分隔）</label>
                <input type="text" name="mustTry" class="form-input" placeholder="如：胡辣汤，水煎包">
            </div>
            <div class="form-group">
                <label class="form-label">小贴士</label>
                <input type="text" name="tips" class="form-input" placeholder="如：早上8点前去人少">
            </div>
            <div class="form-group">
                <label class="form-label">地址 <span class="required">*</span></label>
                <input type="text" id="author-add-address" name="address" class="form-input" placeholder="输入详细地址后点右侧按钮自动识别坐标" required>
            </div>
            <button type="button" class="form-submit-btn" onclick="geocodeAddress()" style="margin-bottom:10px;background:var(--bg-tertiary);color:var(--text-primary);">📍 自动识别坐标</button>
            <input type="hidden" name="lat" id="author-add-lat" value="34.7533">
            <input type="hidden" name="lng" id="author-add-lng" value="113.6654">
            <div id="geocode-result" style="font-size:calc(0.78rem*var(--font-size-multiplier));color:var(--text-muted);margin-bottom:8px;"></div>
            <div class="form-group">
                <label class="form-label">所在区域</label>
                <select name="district" class="form-input">
                    <option value="">选择区域</option>
                    ${['金水区','二七区','中原区','管城回族区','惠济区','郑东新区','高新区','经开区','航空港区','上街区','其他'].map(d => `<option value="${d}">${d}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">营业时间</label>
                <input type="text" name="openingHours" class="form-input" placeholder="如：06:00-14:00">
            </div>
            <div class="form-group">
                <label class="form-label">上传照片（最多9张）</label>
                <input type="file" id="author-add-photos" class="form-input" accept="image/*" multiple onchange="handleAuthorAddPhotos(this.files)">
                <div id="author-add-photo-preview" class="photo-preview"></div>
            </div>
            <button type="submit" class="form-submit-btn">✅ 添加店铺</button>
        </form>
    `;
}

// 当前新增照片列表
let _authorAddPhotos = [];

function handleAuthorAddPhotos(files) {
    var preview = document.getElementById('author-add-photo-preview');
    _authorAddPhotos = [];
    preview.innerHTML = '';
    Array.from(files).forEach(function(file, i) {
        if (i >= 9) return;
        compressImage(file, 800, 800, 0.7).then(function(dataUrl) {
            _authorAddPhotos.push(dataUrl);
            var img = document.createElement('img');
            img.src = dataUrl;
            img.className = 'photo-thumb';
            preview.appendChild(img);
        });
    });
}

function geocodeAddress() {
    var addr = document.getElementById('author-add-address').value.trim();
    var resultEl = document.getElementById('geocode-result');
    if (!addr) { resultEl.textContent = '⚠️ 请先输入地址'; return; }

    // 拼接完整地址
    var fullAddr = '郑州市' + addr;
    resultEl.textContent = '🔄 正在识别坐标...';

    // 高德地理编码 JSONP
    var cbName = '_geoCodeCb_' + Date.now();
    var script = document.createElement('script');
    var done = false;

    function cleanup() {
        if (done) return; done = true;
        clearTimeout(timer);
        delete window[cbName];
        if (script.parentNode) script.parentNode.removeChild(script);
    }
    var timer = setTimeout(function() { cleanup(); resultEl.textContent = '⚠️ 识别超时，请手动输入准确地址'; }, 8000);

    window[cbName] = function(data) {
        if (done) return;
        if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
            var loc = data.geocodes[0].location.split(',');
            var lng = parseFloat(loc[0]);
            var lat = parseFloat(loc[1]);
            document.getElementById('author-add-lat').value = lat;
            document.getElementById('author-add-lng').value = lng;
            resultEl.textContent = '✅ 已识别: ' + lat.toFixed(6) + ', ' + lng.toFixed(6);
        } else {
            resultEl.textContent = '⚠️ 未找到，请补充详细地址后重试';
        }
        cleanup();
    };
    script.onerror = function() { cleanup(); resultEl.textContent = '⚠️ 网络错误，请重试'; };
    script.src = 'https://restapi.amap.com/v3/geocode/geo?key=2d9d689ea5452c206c7423cf00ffe24f&address=' + encodeURIComponent(fullAddr) + '&output=JSON&callback=' + cbName;
    document.head.appendChild(script);
}

function submitAuthorAdd(e) {
    e.preventDefault();
    var fd = new FormData(e.target);
    var storeId = 'store_' + Date.now();

    var newStore = {
        id: storeId,
        name: fd.get('name'),
        category: '其他',
        tags: fd.get('tags') ? fd.get('tags').split(/[,，]/).map(function(t) { return t.trim(); }).filter(Boolean) : [],
        rating: parseInt(fd.get('rating')) || 4,
        priceRange: fd.get('priceRange') || '待补充',
        description: fd.get('description') || '',
        mustTry: fd.get('mustTry') ? fd.get('mustTry').split(/[,，]/).map(function(t) { return t.trim(); }).filter(Boolean) : [],
        tips: fd.get('tips') || '',
        photos: _authorAddPhotos.slice(),
        branches: [{
            id: storeId + '_main',
            name: fd.get('name'),
            address: fd.get('address'),
            district: fd.get('district') || '其他',
            lat: parseFloat(fd.get('lat')) || 34.7533,
            lng: parseFloat(fd.get('lng')) || 113.6654,
            openingHours: fd.get('openingHours') || '',
            phone: '',
        }],
        reviews: [],
    };

    authorAddStore(newStore);
    refreshStores();
    renderHome();
    // 重置
    _authorAddPhotos = [];
    renderAuthorTab('add');
    showToast('✅ 店铺已添加！');
}

/* --- 用户推荐 Tab --- */

function renderAuthorRecTab() {
    const recs = getRecommendations();
    if (recs.length === 0) return '<div class="empty-state"><div class="empty-icon">📨</div><p>暂无用户推荐</p></div>';

    let html = '';
    recs.reverse().forEach(rec => {
        const statusMap = { pending: '⏳ 待审核', approved: '✅ 已通过', rejected: '❌ 已拒绝' };
        html += `
            <div class="author-rec-item">
                <div class="author-rec-header">
                    <strong>${escapeHTML(rec.name)}</strong>
                    <span>${statusMap[rec.status] || ''}</span>
                </div>
                <div class="author-rec-meta">
                    📍 ${escapeHTML(rec.address || '')} · ${escapeHTML(rec.district || '')} · ${escapeHTML(rec.category || '')}
                </div>
                <div class="author-rec-reason">💬 ${escapeHTML(rec.reason || '')}</div>
                ${rec.nickname ? `<div class="author-rec-nick">— ${escapeHTML(rec.nickname)} · ${(rec.submittedAt || '').slice(0,10)}</div>` : ''}
                ${rec.photos && rec.photos.length > 0 ? `<div class="author-rec-photos">${rec.photos.map(p => `<img src="${p}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;margin:4px;">`).join('')}</div>` : ''}
                ${rec.status === 'pending' ? `
                <div class="author-rec-actions">
                    <button class="confirm-btn ok" onclick="approveAndPublishRec('${rec.id}')">✅ 一键发布</button>
                    <button class="confirm-btn cancel" onclick="rejectRec('${rec.id}')">❌ 拒绝</button>
                </div>` : ''}
            </div>
        `;
    });
    return html;
}

function approveAndPublishRec(recId) {
    showConfirm('确定要发布这条推荐吗？将自动创建新店铺。', () => {
        const storeId = publishRecommendation(recId);
        if (storeId) {
            refreshStores();
            renderHome();
            renderAuthorTab('recommendations');
            showToast('✅ 已发布！可在"美食管理"中查看编辑');
        }
    });
}

function rejectRec(recId) {
    reviewRecommendation(recId, 'rejected');
    renderAuthorTab('recommendations');
    showToast('已拒绝该推荐');
}

/* --- 意见反馈 Tab --- */

function renderAuthorFeedbackTab() {
    const fbs = getFeedback();
    if (fbs.length === 0) return '<div class="empty-state"><div class="empty-icon">📧</div><p>暂无意见反馈</p></div>';

    let html = '';
    fbs.reverse().forEach(fb => {
        html += `
            <div class="author-rec-item">
                <div class="author-rec-meta">📅 ${(fb.submittedAt || '').slice(0,10)} · 来自：${escapeHTML(fb.nickname || '匿名')}</div>
                <div class="author-rec-reason">${escapeHTML(fb.message || '')}</div>
            </div>
        `;
    });
    return html;
}

/* --- 导出 Tab --- */

/* --- 站点设置 Tab --- */

function renderSiteConfigTab() {
    var currentBanner = Storage.getBannerText();
    var currentStyle = Storage.getBannerStyle();
    return `
        <div style="padding:0;">
            <h3 style="margin-bottom:12px;">🏠 首页横幅设置</h3>
            <div class="form-group">
                <label class="form-label">横幅文字（支持换行，留空隐藏）</label>
                <textarea id="banner-text-input" class="form-input form-textarea" rows="4" placeholder="输入自定义文字...">${escapeHTML(currentBanner)}</textarea>
            </div>
            <div class="form-group">
                <label class="form-label">字体颜色</label>
                <input type="color" id="banner-color-input" class="form-input" value="${escapeHTML(currentStyle.color || '#999999')}" style="height:40px;width:60px;padding:4px;">
            </div>
            <div class="form-group">
                <label class="form-label">字体样式</label>
                <select id="banner-font-input" class="form-input">
                    <option value="monospace" ${currentStyle.font==='monospace'?'selected':''}>等宽像素风</option>
                    <option value='"Microsoft YaHei",sans-serif' ${currentStyle.font==='"Microsoft YaHei",sans-serif'?'selected':''}>微软雅黑</option>
                    <option value='"STKaiti","KaiTi",serif' ${currentStyle.font==='"STKaiti","KaiTi",serif'?'selected':''}>楷体</option>
                    <option value='"SimSun",serif' ${currentStyle.font==='"SimSun",serif'?'selected':''}>宋体</option>
                    <option value='cursive' ${currentStyle.font==='cursive'?'selected':''}>手写体</option>
                    <option value='"Courier New",monospace' ${currentStyle.font==='"Courier New",monospace'?'selected':''}>西文像素</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">字号大小：${currentStyle.size || '0.82'}rem</label>
                <input type="range" id="banner-size-input" class="form-input" min="0.5" max="2" step="0.02" value="${currentStyle.size || '0.82'}" style="padding:0;height:6px;">
            </div>
            <button class="form-submit-btn" onclick="saveBannerConfig()">💾 保存设置</button>
            <div id="banner-preview" style="margin-top:14px;padding:12px;background:var(--bg-secondary);border-radius:8px;border:1px dashed var(--border-color);text-align:center;letter-spacing:2px;white-space:pre-wrap;word-break:break-all;color:${escapeHTML(currentStyle.color||'#999')};font-family:${currentStyle.font||'monospace'};font-size:calc(${currentStyle.size||'0.82'}rem*var(--font-size-multiplier));">${escapeHTML(currentBanner || '· · 预 览 横 幅 · ·')}</div>
        </div>
    `;
}

function initBannerPreview() {
    var textEl = document.getElementById('banner-text-input');
    var colorEl = document.getElementById('banner-color-input');
    var fontEl = document.getElementById('banner-font-input');
    var sizeEl = document.getElementById('banner-size-input');
    var preview = document.getElementById('banner-preview');
    if (!preview) return;

    function update() {
        preview.textContent = textEl.value || '· · 预 览 横 幅 · ·';
        preview.style.color = colorEl.value;
        preview.style.fontFamily = fontEl.value;
        preview.style.fontSize = 'calc(' + sizeEl.value + 'rem * var(--font-size-multiplier))';
    }

    textEl.addEventListener('input', update);
    colorEl.addEventListener('input', update);
    fontEl.addEventListener('change', update);
    sizeEl.addEventListener('input', update);
}

function saveBannerConfig() {
    var text = document.getElementById('banner-text-input').value;
    var color = document.getElementById('banner-color-input').value;
    var font = document.getElementById('banner-font-input').value;
    var size = document.getElementById('banner-size-input').value;
    Storage.setBannerText(text);
    Storage.setBannerStyle({ color: color, font: font, size: size });
    refreshStores();
    renderHome();
    showToast(text ? '横幅已更新 ✅' : '横幅已清空');
}

/* --- 导出 Tab --- */

function renderAuthorExportTab() {
    const stats = getAuthorStats();
    const jsonPreview = exportFoodsJSON();

    return `
        <div style="padding:0;">
            <div class="author-stats">
                <div class="author-stat-item">📊 当前数据：${getMergedStores().length} 家店铺</div>
                ${stats.hasChanges ? `<div class="author-stat-warn">⚠️ 待发布修改：${stats.added}新增 ${stats.edited}修改 ${stats.deleted}删除</div>` : '<div class="author-stat-ok">✅ 数据无修改</div>'}
            </div>

            <button class="form-submit-btn" onclick="oneClickPublish()" style="margin-bottom:8px;background:#27ae60;">🚀 一键发布到线上</button>
            <div id="publish-status" style="margin-bottom:12px;font-size:calc(0.78rem*var(--font-size-multiplier));"></div>

            <button class="form-submit-btn" onclick="downloadFoodsJSON()" style="margin-bottom:12px;background:var(--bg-tertiary);color:var(--text-primary);">⬇️ 下载 foods.json（备用）</button>

            <div class="form-group">
                <label class="form-label">JSON 预览</label>
                <textarea class="form-input form-textarea" rows="10" style="font-size:0.65rem;font-family:monospace;" readonly>${escapeHTML(jsonPreview)}</textarea>
            </div>

            <button class="form-revert-btn" onclick="clearAllChanges()">⚠️ 清除所有未发布的修改</button>
        </div>
    `;
}

async function oneClickPublish() {
    const stats = getAuthorStats();
    if (!stats.hasChanges) { showToast('没有需要发布的修改'); return; }

    const statusEl = document.getElementById('publish-status');
    statusEl.textContent = '🔄 正在发布...';
    statusEl.style.color = 'var(--text-muted)';

    const stores = getMergedStores();
    const message = '📝 作者一键发布（' + stats.added + '新增 ' + stats.edited + '修改 ' + stats.deleted + '删除）';

    try {
        const resp = await fetch('/.netlify/functions/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stores: stores, message: message }),
        });
        const data = await resp.json();
        if (data.success) {
            statusEl.innerHTML = '✅ 发布成功！1分钟后全网更新<br><small style="color:var(--text-muted)">刷新页面即可看到最新版本</small>';
            statusEl.style.color = '#27ae60';
            // 清除 localStorage 修改（已固化到线上）
            clearAllAuthorChanges();
            refreshStores();
            renderHome();
            setTimeout(() => renderAuthorTab('export'), 1500);
        } else {
            statusEl.textContent = '❌ 发布失败：' + (data.error || '未知错误');
            statusEl.style.color = '#e74c3c';
        }
    } catch (e) {
        statusEl.textContent = '❌ 网络错误，请稍后重试';
        statusEl.style.color = '#e74c3c';
    }
}

function clearAllChanges() {
    showConfirm('确定清除所有未导出的修改吗？此操作不可恢复！', () => {
        clearAllAuthorChanges();
        refreshStores();
        renderHome();
        renderAuthorTab('export');
        showToast('已清除所有修改');
    });
}

function updateAuthorBadges() {
    const recBadge = document.getElementById('auth-rec-badge');
    const fbBadge = document.getElementById('auth-fb-badge');
    if (recBadge) {
        const pending = getRecommendations().filter(function(r) { return r.status === 'pending'; }).length;
        recBadge.textContent = pending > 0 ? pending : '';
        recBadge.style.display = pending > 0 ? 'inline' : 'none';
    }
    if (fbBadge) {
        const allFb = getFeedback();
        const lastRead = getLastFeedbackRead();
        const unread = allFb.filter(function(f) { return (f.submittedAt || '') > lastRead; }).length;
        fbBadge.textContent = unread > 0 ? unread : '';
        fbBadge.style.display = unread > 0 ? 'inline' : 'none';
    }
}

function getLastFeedbackRead() {
    try { return localStorage.getItem('zzfood_fb_read') || ''; } catch(e) { return ''; }
}

function markFeedbackRead() {
    localStorage.setItem('zzfood_fb_read', new Date().toISOString());
}

/* ============================================
   原有功能（深色模式/字体/缓存/反馈/关于）
   ============================================ */

function toggleDarkMode() {
    const enabled = !Storage.getDarkMode();
    Storage.setDarkMode(enabled);
    applyTheme();
    updateSettingsCounts();
}

function applyTheme() {
    document.body.classList.toggle('dark', Storage.getDarkMode());
}

function applyFontSize() {
    const size = Storage.getFontSize();
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add('font-' + size);
    document.querySelectorAll('.fontsize-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.size === size);
    });
}

function showFontSizeDialog() {
    document.getElementById('fontsize-dialog').classList.remove('hidden');
    applyFontSize();
}

function hideFontSizeDialog() {
    document.getElementById('fontsize-dialog').classList.add('hidden');
}

function setFontSize(size) {
    Storage.setFontSize(size);
    applyFontSize();
    updateSettingsCounts();
    hideFontSizeDialog();
}

function confirmClearCache() {
    showConfirm('确定要清除缓存数据吗？这将删除浏览历史。（收藏、深色模式和字体设置不受影响）', () => {
        Storage.clearAll();
        updateSettingsCounts();
        showToast('缓存已清除 ✅');
    });
}

function openFeedback() {
    // 使用作者数据存储
    const message = prompt('请输入你的意见或建议：');
    if (message && message.trim()) {
        addFeedback({
            message: message.trim(),
            nickname: '用户',
        });
        showToast('感谢你的反馈！🙏');
    }
}

function openAboutPage() {
    const page = createSubPage('关于本站');
    page.innerHTML = `
        <div class="about-content">
            <div class="about-logo">🍜</div>
            <div class="about-title">吃遍郑州</div>
            <div class="about-version">版本 1.0.0</div>
            <div class="about-desc">
                <p>吃遍郑州是一个公益性质的美食导航网站，旨在帮助来到郑州的朋友发现最地道的美食。</p>
                <br>
                <p>📌 <strong>数据来源：</strong>美食爱好者投稿 + 作者实地探访</p>
                <p>🔄 <strong>更新频率：</strong>持续更新中</p>
                <br>
                <p style="color: var(--text-muted); font-size: 0.85rem;">Made with ❤️ in 郑州</p>
            </div>
        </div>
    `;
    showSubPage(page);
}

/* --- 收藏/历史子页面 --- */

function openSublistPage(type) {
    let title, storeIds;
    if (type === 'favorites') {
        title = '我的收藏';
        storeIds = Storage.getFavorites();
    } else {
        title = '浏览历史';
        storeIds = Storage.getHistory().map(h => h.id);
    }

    const page = createSubPage(title);
    const stores = getMergedStores();

    if (storeIds.length === 0) {
        page.innerHTML = `<div class="empty-state"><div class="empty-icon">${type === 'favorites' ? '💔' : '🕐'}</div><p>${type === 'favorites' ? '还没有收藏任何店铺' : '还没有浏览记录'}</p></div>`;
    } else {
        let html = '<div class="settings-list">';
        storeIds.forEach(id => {
            const store = stores.find(s => s.id === id);
            if (store) {
                const imageHTML = store.photos && store.photos.length > 0
                    ? `<img class="subitem-img" src="${escapeHTML(store.photos[0])}" alt="${escapeHTML(store.name)}" onerror="this.style.display='none';">`
                    : `<div class="subitem-img" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🍜</div>`;
                const distStr = getNearestDistanceStr(store, userLocation?.lat, userLocation?.lng);
                html += `
                    <div class="subitem-card">
                        <div onclick="closeSubPage();openDetail('${escapeHTML(store.id)}')" style="display:flex;align-items:center;gap:12px;flex:1;min-width:0;">
                            ${imageHTML}
                            <div class="subitem-info">
                                <div class="subitem-name">${escapeHTML(store.name)}</div>
                                <div class="subitem-meta">${renderStars(store.rating)} · 📍 ${distStr}</div>
                            </div>
                        </div>
                        <button class="subitem-del-btn" onclick="event.stopPropagation();removeFavoriteItem('${escapeHTML(id)}','${type}')" title="取消收藏">✕</button>
                    </div>
                `;
            }
        });
        html += '</div>';
        page.innerHTML = html;
    }
    showSubPage(page);
}

function removeFavoriteItem(storeId, type) {
    Storage.removeFavorite(storeId);
    updateSettingsCounts();
    // 刷新当前列表
    openSublistPage(type);
    showToast('已取消收藏');
}

function createSubPage(title) {
    const existing = document.querySelector('.sublist-page');
    if (existing) existing.remove();
    const page = document.createElement('div');
    page.className = 'detail-page sublist-page';
    page.innerHTML = `
        <div class="detail-header">
            <button class="detail-back" onclick="closeSubPage();updateSettingsCounts();">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <h2 class="detail-title">${escapeHTML(title)}</h2>
            <div></div>
        </div>
        <div class="subpage-content"></div>
    `;
    return page.querySelector('.subpage-content');
}

function showSubPage(contentEl) {
    document.body.appendChild(contentEl.parentElement);
}

function closeSubPage() {
    const page = document.querySelector('.sublist-page');
    if (page) page.remove();
    updateSettingsCounts();
}

/* --- 推荐表单（带照片上传）--- */

function openRecommendPage() {
    document.getElementById('recommend-form').classList.remove('hidden');
    document.getElementById('recommend-success').classList.add('hidden');
    document.getElementById('recommend-page').classList.remove('hidden');
    // 清空照片预览
    const preview = document.getElementById('photo-preview');
    if (preview) preview.innerHTML = '';
}

function closeRecommendPage() {
    document.getElementById('recommend-page').classList.add('hidden');
}

function handlePhotoUpload(files) {
    const preview = document.getElementById('photo-preview');
    if (!preview) return;

    Array.from(files).forEach((file, i) => {
        if (i >= 9) return; // 最多 9 张
        compressImage(file, 800, 800, 0.7).then(dataUrl => {
            const img = document.createElement('img');
            img.src = dataUrl;
            img.className = 'photo-thumb';
            img.dataset.dataUrl = dataUrl;
            preview.appendChild(img);
        });
    });
}

function submitRecommend(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('.form-submit-btn');
    btn.disabled = true;
    btn.textContent = '提交中...';

    const formData = new FormData(form);

    // 收集照片
    const photos = [];
    document.querySelectorAll('#photo-preview .photo-thumb').forEach(img => {
        if (img.dataset.dataUrl) photos.push(img.dataset.dataUrl);
    });

    const data = {
        name: formData.get('name'),
        district: formData.get('district'),
        address: formData.get('address'),
        category: formData.get('category'),
        reason: formData.get('reason'),
        nickname: formData.get('nickname') || '匿名美食家',
        photos: photos,
        timestamp: new Date().toISOString(),
    };

    // 保存到作者存储
    addRecommendation(data);

    // 也尝试发送到后端
    submitToBackend(data).catch(() => {});

    setTimeout(() => {
        form.classList.add('hidden');
        document.getElementById('recommend-success').classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = '提交推荐';
    }, 500);
}

async function submitToBackend(data) {
    try {
        const resp = await fetch('/api/submit-recommendation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!resp.ok) throw new Error('Failed');
        return resp.json();
    } catch (e) {
        // 静默失败，localStorage 已经保存了
    }
}
