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
        case 'recommend': openRecommendPage(); break;
        case 'favorites': openSublistPage('favorites'); break;
        case 'history': openSublistPage('history'); break;
        case 'darkmode': toggleDarkMode(); break;
        case 'fontsize': showFontSizeDialog(); break;
        case 'clearcache': confirmClearCache(); break;
        case 'feedback': openFeedback(); break;
        case 'about': openAboutPage(); break;
        case 'author': handleAuthorAction(); break;
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
        case 'feedback': container.innerHTML = renderAuthorFeedbackTab(); break;
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
    const storeId = 'store_' + Date.now();
    return `
        <form id="author-add-form" class="recommend-form" onsubmit="submitAuthorAdd(event)" style="padding:0;">
            <div class="form-group">
                <label class="form-label">店铺名称 <span class="required">*</span></label>
                <input type="text" name="name" class="form-input" placeholder="输入店铺名称" required>
            </div>
            <div class="form-group">
                <label class="form-label">分类</label>
                <select name="category" class="form-input">
                    <option value="">选择分类</option>
                    <option value="胡辣汤">胡辣汤</option><option value="烩面">烩面</option>
                    <option value="豫菜">豫菜</option><option value="小吃">小吃</option>
                    <option value="早餐">早餐</option><option value="夜宵">夜宵</option>
                    <option value="烧烤">烧烤</option><option value="火锅">火锅</option>
                    <option value="面食">面食</option><option value="甜点饮品">甜点饮品</option>
                    <option value="其他">其他</option>
                </select>
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
                <input type="text" name="address" class="form-input" placeholder="详细地址" required>
            </div>
            <div class="form-group">
                <label class="form-label">所在区域</label>
                <select name="district" class="form-input">
                    <option value="">选择区域</option>
                    <option value="金水区">金水区</option><option value="二七区">二七区</option>
                    <option value="中原区">中原区</option><option value="管城回族区">管城回族区</option>
                    <option value="惠济区">惠济区</option><option value="郑东新区">郑东新区</option>
                    <option value="高新区">高新区</option><option value="经开区">经开区</option>
                    <option value="航空港区">航空港区</option><option value="上街区">上街区</option>
                    <option value="其他">其他</option>
                </select>
            </div>
            <div class="form-row">
                <div class="form-group" style="flex:1;">
                    <label class="form-label">纬度</label>
                    <input type="number" name="lat" class="form-input" step="0.0001" placeholder="34.75">
                </div>
                <div class="form-group" style="flex:1;">
                    <label class="form-label">经度</label>
                    <input type="number" name="lng" class="form-input" step="0.0001" placeholder="113.66">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">营业时间</label>
                <input type="text" name="openingHours" class="form-input" placeholder="如：06:00-14:00">
            </div>
            <button type="submit" class="form-submit-btn">✅ 添加店铺</button>
        </form>
    `;
}

function submitAuthorAdd(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const storeId = 'store_' + Date.now();

    const newStore = {
        id: storeId,
        name: fd.get('name'),
        category: fd.get('category') || '其他',
        tags: fd.get('tags') ? fd.get('tags').split(/[,，]/).map(t => t.trim()).filter(Boolean) : [],
        rating: parseInt(fd.get('rating')) || 4,
        priceRange: fd.get('priceRange') || '待补充',
        description: fd.get('description') || '',
        mustTry: fd.get('mustTry') ? fd.get('mustTry').split(/[,，]/).map(t => t.trim()).filter(Boolean) : [],
        tips: fd.get('tips') || '',
        photos: [],
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
    renderAuthorTab('add'); // 清空表单
    showToast('✅ 店铺已添加！（导出数据后永久生效）');
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

function renderAuthorExportTab() {
    const stats = getAuthorStats();
    const jsonPreview = exportFoodsJSON();

    return `
        <div style="padding:0;">
            <div class="author-stats">
                <div class="author-stat-item">📊 当前数据：${getMergedStores().length} 家店铺</div>
                ${stats.hasChanges ? `<div class="author-stat-warn">⚠️ 待导出修改：${stats.added}新增 ${stats.edited}修改 ${stats.deleted}删除</div>` : '<div class="author-stat-ok">✅ 数据无修改</div>'}
            </div>

            <button class="form-submit-btn" onclick="downloadFoodsJSON()" style="margin-bottom:12px;">⬇️ 下载更新后的 foods.json</button>

            <div class="form-group">
                <label class="form-label">JSON 预览（复制后手动替换 data/foods.json）</label>
                <textarea class="form-input form-textarea" rows="12" style="font-size:0.7rem;font-family:monospace;" readonly>${escapeHTML(jsonPreview)}</textarea>
            </div>

            <button class="form-revert-btn" onclick="clearAllChanges()">⚠️ 清除所有未导出的修改</button>
        </div>
    `;
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
        const pending = getRecommendations().filter(r => r.status === 'pending').length;
        recBadge.textContent = pending > 0 ? pending : '';
        recBadge.style.display = pending > 0 ? 'inline' : 'none';
    }
    if (fbBadge) {
        const count = getFeedback().length;
        fbBadge.textContent = count > 0 ? count : '';
        fbBadge.style.display = count > 0 ? 'inline' : 'none';
    }
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
    showConfirm('确定要清除缓存数据吗？这将删除所有收藏和浏览历史。（深色模式和字体设置不受影响）', () => {
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
            <div class="about-title">郑州美食地图</div>
            <div class="about-version">版本 1.0.0</div>
            <div class="about-desc">
                <p>郑州美食地图是一个公益性质的美食导航网站，旨在帮助来到郑州的朋友发现最地道的美食。</p>
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
                    <div class="subitem-card" onclick="closeSubPage();openDetail('${escapeHTML(store.id)}')">
                        ${imageHTML}
                        <div class="subitem-info">
                            <div class="subitem-name">${escapeHTML(store.name)}</div>
                            <div class="subitem-meta">${renderStars(store.rating)} · 📍 ${distStr}</div>
                        </div>
                    </div>
                `;
            }
        });
        html += '</div>';
        page.innerHTML = html;
    }
    showSubPage(page);
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
