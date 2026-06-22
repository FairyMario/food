/* ============================================
   详情页逻辑
   ============================================ */

let currentDetailStoreId = null;

function openDetail(storeId) {
    const stores = getMergedStores();
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    currentDetailStoreId = storeId;
    Storage.addHistory(storeId);
    renderDetail(store);
    document.getElementById('detail-page').classList.remove('hidden');
    updateFavoriteBtn();

    // 作者模式：显示编辑按钮
    if (isAuthorMode()) {
        document.getElementById('detail-edit-btn').classList.remove('hidden');
        document.getElementById('detail-delete-btn').classList.remove('hidden');
    } else {
        document.getElementById('detail-edit-btn').classList.add('hidden');
        document.getElementById('detail-delete-btn').classList.add('hidden');
    }
}

function closeDetail() {
    document.getElementById('detail-page').classList.add('hidden');
    currentDetailStoreId = null;
    renderHome();
    updateSettingsCounts();
}

function renderDetail(store) {
    const container = document.getElementById('detail-content');

    // 图片轮播
    let galleryHTML;
    if (store.photos && store.photos.length > 0) {
        const images = store.photos.map((p, i) =>
            `<img class="detail-gallery-img" src="${escapeHTML(p)}" alt="${escapeHTML(store.name)}" style="display:${i === 0 ? 'block' : 'none'};" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` +
            `<div class="gallery-placeholder" style="display:none;">🍜</div>`
        ).join('');
        const dots = store.photos.map((_, i) =>
            `<span class="gallery-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
        ).join('');
        galleryHTML = `
            <div class="detail-gallery" id="detail-gallery">
                ${images}
                ${store.photos.length > 1 ? `<div class="gallery-dots">${dots}</div>` : ''}
            </div>
        `;
    } else {
        galleryHTML = `<div class="detail-gallery"><div class="gallery-placeholder" style="display:flex;">🍜</div></div>`;
    }

    const tagsHTML = (store.tags || []).map(t => `<span class="detail-tag">${escapeHTML(t)}</span>`).join('');
    const mustTryHTML = (store.mustTry || []).map(item => `<span class="musttry-item">🥢 ${escapeHTML(item)}</span>`).join('');

    const branchesHTML = (store.branches || []).map(branch => `
        <div class="branch-card">
            <div class="branch-card-info">
                <div class="branch-card-name">${escapeHTML(branch.name)}</div>
                <div class="branch-card-detail">📍 ${escapeHTML(branch.address)}</div>
                ${branch.openingHours ? `<div class="branch-card-detail">🕐 ${escapeHTML(branch.openingHours)}</div>` : ''}
            </div>
            <button class="branch-card-nav" onclick="event.stopPropagation();openNavigation(${branch.lat},${branch.lng},'${escapeHTML(branch.name)}')">🧭 导航</button>
        </div>
    `).join('');

    const reviewsHTML = (store.reviews && store.reviews.length > 0)
        ? store.reviews.map(r => `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-user">
                        <span class="review-avatar">${r.avatar || '😊'}</span>${escapeHTML(r.user)}
                    </span>
                    <span class="review-date">${escapeHTML(r.date)}</span>
                </div>
                <div class="review-rating">${renderStars(r.rating)}</div>
                <div class="review-comment">${escapeHTML(r.comment)}</div>
            </div>
        `).join('')
        : `<div style="text-align:center;color:var(--text-muted);padding:20px;">暂无评价，快来第一个评价吧~</div>`;

    container.innerHTML = `
        ${galleryHTML}
        <div class="detail-info">
            <h2 class="detail-name">${escapeHTML(store.name)}</h2>
            <div class="detail-meta-row">
                <span class="detail-rating">${renderStars(store.rating)}</span>
                <span class="detail-price">💰 人均 ${escapeHTML(store.priceRange || '暂无')}</span>
            </div>
            <div class="detail-tags">${tagsHTML}</div>
        </div>

        ${store.description ? `
        <div class="detail-section">
            <div class="detail-section-title">📝 店铺介绍</div>
            <div class="detail-description">${escapeHTML(store.description)}</div>
        </div>` : ''}

        ${store.mustTry && store.mustTry.length > 0 ? `
        <div class="detail-section">
            <div class="detail-section-title">🏆 必点推荐</div>
            <div class="detail-musttry">${mustTryHTML}</div>
        </div>` : ''}

        <div class="detail-section">
            <div class="detail-section-title">📍 分店地址</div>
            ${branchesHTML}
        </div>

        ${store.tips ? `
        <div class="detail-section">
            <div class="detail-section-title">💡 小贴士</div>
            <div class="detail-tips">${escapeHTML(store.tips)}</div>
        </div>` : ''}

        <div class="detail-section">
            <div class="detail-section-title">💬 用户评价（${(store.reviews || []).length}条）</div>
            ${reviewsHTML}
            <!-- 新增评价表单 -->
            <div class="review-form" style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border-color);">
                <div class="review-form-title" style="font-size:calc(0.85rem*var(--font-size-multiplier));font-weight:600;margin-bottom:10px;">✍️ 写评价</div>
                <input type="text" id="review-nickname-${store.id}" class="form-input" placeholder="你的昵称" style="margin-bottom:8px;" maxlength="20" value="${escapeHTML(Storage.getNickname())}">
                <div class="review-stars" id="review-stars-${store.id}" style="margin-bottom:8px;font-size:1.3rem;cursor:pointer;">
                    <span data-star="1">☆</span><span data-star="2">☆</span><span data-star="3">☆</span><span data-star="4">☆</span><span data-star="5">☆</span>
                </div>
                <textarea id="review-text-${store.id}" class="form-input form-textarea" rows="2" placeholder="写下你的评价..." maxlength="500"></textarea>
                <button class="form-submit-btn" onclick="submitReview('${store.id}')" style="margin-top:8px;padding:10px;font-size:calc(0.85rem*var(--font-size-multiplier));">提交评价</button>
            </div>
        </div>
    `;

    if (store.photos && store.photos.length > 1) {
        initGallery(store.photos.length);
    }

    // 初始化评价星星
    setTimeout(function() { initReviewStars(store.id); }, 100);
}

function initGallery(count) {
    const dots = document.querySelectorAll('.gallery-dot');
    const images = document.querySelectorAll('.detail-gallery-img');
    let currentIndex = 0;

    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(parseInt(dot.dataset.index));
        });
    });

    let touchStartX = 0;
    const gallery = document.getElementById('detail-gallery');
    gallery.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
    gallery.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentIndex < count - 1) showImage(currentIndex + 1);
            else if (diff < 0 && currentIndex > 0) showImage(currentIndex - 1);
        }
    });

    function showImage(idx) {
        images.forEach((img, i) => img.style.display = i === idx ? 'block' : 'none');
        dots.forEach((dot, i) => dot.classList.toggle('active', i === idx));
        currentIndex = idx;
    }
}

function updateFavoriteBtn() {
    const btn = document.getElementById('detail-favorite');
    if (!currentDetailStoreId) return;
    btn.classList.toggle('favorited', Storage.isFavorite(currentDetailStoreId));
}

function toggleDetailFavorite() {
    if (!currentDetailStoreId) return;
    const isFav = Storage.toggleFavorite(currentDetailStoreId);
    document.getElementById('detail-favorite').classList.toggle('favorited', isFav);
    showToast(isFav ? '已添加到收藏 ❤️' : '已取消收藏');
    updateSettingsCounts();
}

/* ============================================
   作者编辑功能
   ============================================ */

function authorDeleteCurrentStore() {
    if (!currentDetailStoreId) return;
    showConfirm('确定要删除「' + (findStoreById(currentDetailStoreId)?.name || '') + '」吗？', () => {
        authorDeleteStore(currentDetailStoreId);
        refreshStores();
        closeDetail();
        showToast('店铺已删除（导出数据后生效）');
    });
}

function openEditForm() {
    if (!currentDetailStoreId) return;
    const store = getMergedStores().find(s => s.id === currentDetailStoreId);
    if (!store) return;

    const page = createEditStorePage(store);
    showSubPage(page);
}

// 编辑时暂存的分店和照片数据
let _editBranches = [];
let _editPhotos = [];

function createEditStorePage(store) {
    _editBranches = JSON.parse(JSON.stringify(store.branches || []));
    _editPhotos = JSON.parse(JSON.stringify(store.photos || []));

    var branchesHTML = _editBranches.map(function(b, i) {
        return '<div class="edit-branch-item" style="background:var(--bg-tertiary);border-radius:8px;padding:12px;margin-bottom:10px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
            '<strong style="font-size:calc(0.85rem*var(--font-size-multiplier)))">分店' + (i+1) + '</strong>' +
            (_editBranches.length > 1 ? '<button type="button" class="subitem-del-btn" onclick="removeEditBranch('+i+')">✕</button>' : '') +
            '</div>' +
            '<input class="form-input" placeholder="分店名称" value="' + escapeHTML(b.name || '') + '" data-branch="'+i+'" data-field="name" style="margin-bottom:6px;">' +
            '<input class="form-input" placeholder="详细地址" value="' + escapeHTML(b.address || '') + '" data-branch="'+i+'" data-field="address" style="margin-bottom:6px;">' +
            '<select class="form-input" data-branch="'+i+'" data-field="district" style="margin-bottom:6px;">' + generateDistrictOptions(b.district || '') + '</select>' +
            '<div class="form-row">' +
            '<input type="number" class="form-input" placeholder="纬度" step="0.0001" value="' + (b.lat || '') + '" data-branch="'+i+'" data-field="lat" style="flex:1;">' +
            '<input type="number" class="form-input" placeholder="经度" step="0.0001" value="' + (b.lng || '') + '" data-branch="'+i+'" data-field="lng" style="flex:1;">' +
            '</div>' +
            '<input class="form-input" placeholder="营业时间 如：06:00-14:00" value="' + escapeHTML(b.openingHours || '') + '" data-branch="'+i+'" data-field="openingHours" style="margin-top:6px;">' +
            '</div>';
    }).join('');

    var photosHTML = _editPhotos.map(function(p, i) {
        return '<div style="position:relative;display:inline-block;margin:4px;">' +
            '<img src="' + p + '" style="width:70px;height:70px;object-fit:cover;border-radius:6px;">' +
            '<button type="button" onclick="removeEditPhoto('+i+')" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:none;background:#e74c3c;color:#fff;font-size:0.7rem;cursor:pointer;line-height:20px;">✕</button>' +
            '</div>';
    }).join('');

    const page = document.createElement('div');
    page.className = 'detail-page sublist-page';
    page.innerHTML = `
        <div class="detail-header">
            <button class="detail-back" onclick="closeSubPage();refreshStores();renderHome();updateSettingsCounts();">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <h2 class="detail-title">编辑：${escapeHTML(store.name)}</h2>
            <div></div>
        </div>
        <div class="recommend-content">
            <form id="edit-store-form" class="recommend-form" onsubmit="submitEditStore(event, '${store.id}')">
                <div class="form-group">
                    <label class="form-label">店铺名称 <span class="required">*</span></label>
                    <input type="text" name="name" class="form-input" value="${escapeHTML(store.name)}" required>
                </div>
                <div class="form-group">
                    <label class="form-label">分类</label>
                    <select name="category" class="form-input">${generateCategoryOptions(store.category)}</select>
                </div>
                <div class="form-group"><label class="form-label">标签（逗号分隔）</label><input type="text" name="tags" class="form-input" value="${escapeHTML((store.tags||[]).join('，'))}"></div>
                <div class="form-group"><label class="form-label">推荐星级</label><input type="number" name="rating" class="form-input" min="1" max="5" value="${store.rating||4}"></div>
                <div class="form-group"><label class="form-label">人均价格</label><input type="text" name="priceRange" class="form-input" value="${escapeHTML(store.priceRange||'')}" placeholder="如：20-40元"></div>
                <div class="form-group"><label class="form-label">店铺介绍</label><textarea name="description" class="form-input form-textarea" rows="3">${escapeHTML(store.description||'')}</textarea></div>
                <div class="form-group"><label class="form-label">必点推荐（逗号分隔）</label><input type="text" name="mustTry" class="form-input" value="${escapeHTML((store.mustTry||[]).join('，'))}"></div>
                <div class="form-group"><label class="form-label">小贴士</label><input type="text" name="tips" class="form-input" value="${escapeHTML(store.tips||'')}"></div>

                <!-- 分店 -->
                <div class="form-group">
                    <label class="form-label">📍 分店地址</label>
                    <div id="edit-branches-container">${branchesHTML}</div>
                    <button type="button" class="form-submit-btn" onclick="addEditBranch()" style="background:var(--bg-tertiary);color:var(--text-primary);margin-top:0;">➕ 添加分店</button>
                </div>

                <!-- 照片 -->
                <div class="form-group">
                    <label class="form-label">🖼️ 店铺照片</label>
                    <div id="edit-photos-container" style="min-height:30px;">${photosHTML || '<div style="color:var(--text-muted);font-size:calc(0.78rem*var(--font-size-multiplier)))">暂无照片</div>'}</div>
                    <input type="file" id="edit-photos-input" class="form-input" accept="image/*" multiple onchange="handleEditPhotos(this.files)" style="margin-top:6px;">
                </div>

                <button type="submit" class="form-submit-btn">💾 保存修改</button>
                <button type="button" class="form-revert-btn" onclick="authorRevertStore('${store.id}');closeSubPage();refreshStores();renderHome();showToast('已还原为原始数据')">↩️ 还原原始数据</button>
            </form>
        </div>
    `;
    document.body.appendChild(page);
    return page.querySelector('.subpage-content');
}

function addEditBranch() {
    _editBranches.push({ id: 'br_' + Date.now(), name: '', address: '', district: '', lat: '', lng: '', openingHours: '', phone: '' });
    refreshEditBranchesUI();
}

function removeEditBranch(index) {
    if (_editBranches.length <= 1) { showToast('至少保留一个分店'); return; }
    _editBranches.splice(index, 1);
    refreshEditBranchesUI();
}

function refreshEditBranchesUI() {
    var container = document.getElementById('edit-branches-container');
    if (!container) return;
    container.innerHTML = _editBranches.map(function(b, i) {
        return '<div class="edit-branch-item" style="background:var(--bg-tertiary);border-radius:8px;padding:12px;margin-bottom:10px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
            '<strong>分店' + (i+1) + '</strong>' +
            (_editBranches.length > 1 ? '<button type="button" class="subitem-del-btn" onclick="removeEditBranch('+i+')">✕</button>' : '') +
            '</div>' +
            '<input class="form-input" placeholder="分店名称" value="' + escapeHTML(b.name || '') + '" data-branch="'+i+'" data-field="name" style="margin-bottom:6px;">' +
            '<input class="form-input" placeholder="详细地址" value="' + escapeHTML(b.address || '') + '" data-branch="'+i+'" data-field="address" style="margin-bottom:6px;">' +
            '<select class="form-input" data-branch="'+i+'" data-field="district" style="margin-bottom:6px;">' + generateDistrictOptions(b.district || '') + '</select>' +
            '<div class="form-row">' +
            '<input type="number" class="form-input" placeholder="纬度" step="0.0001" value="' + (b.lat || '') + '" data-branch="'+i+'" data-field="lat" style="flex:1;">' +
            '<input type="number" class="form-input" placeholder="经度" step="0.0001" value="' + (b.lng || '') + '" data-branch="'+i+'" data-field="lng" style="flex:1;">' +
            '</div>' +
            '<input class="form-input" placeholder="营业时间 如：06:00-14:00" value="' + escapeHTML(b.openingHours || '') + '" data-branch="'+i+'" data-field="openingHours" style="margin-top:6px;">' +
            '</div>';
    }).join('');
}

function removeEditPhoto(index) {
    _editPhotos.splice(index, 1);
    refreshEditPhotosUI();
}

function handleEditPhotos(files) {
    Array.from(files).forEach(function(file, i) {
        if (_editPhotos.length + i >= 9) return;
        compressImage(file, 800, 800, 0.7).then(function(dataUrl) {
            _editPhotos.push(dataUrl);
            refreshEditPhotosUI();
        });
    });
}

function refreshEditPhotosUI() {
    var container = document.getElementById('edit-photos-container');
    if (!container) return;
    if (_editPhotos.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted);font-size:0.78rem;">暂无照片</div>';
        return;
    }
    container.innerHTML = _editPhotos.map(function(p, i) {
        return '<div style="position:relative;display:inline-block;margin:4px;">' +
            '<img src="' + p + '" style="width:70px;height:70px;object-fit:cover;border-radius:6px;">' +
            '<button type="button" onclick="removeEditPhoto('+i+')" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:none;background:#e74c3c;color:#fff;font-size:0.7rem;cursor:pointer;line-height:20px;">✕</button>' +
            '</div>';
    }).join('');
}

function collectEditBranches() {
    var container = document.getElementById('edit-branches-container');
    if (!container) return _editBranches;
    var inputs = container.querySelectorAll('[data-branch]');
    inputs.forEach(function(inp) {
        var i = parseInt(inp.dataset.branch);
        var field = inp.dataset.field;
        if (_editBranches[i]) {
            _editBranches[i][field] = (field === 'lat' || field === 'lng') ? parseFloat(inp.value) || '' : inp.value;
        }
    });
    return _editBranches;
}

function submitEditStore(e, storeId) {
    e.preventDefault();
    var form = e.target;
    var fd = new FormData(form);
    var branches = collectEditBranches();

    var newData = {
        name: fd.get('name'),
        category: fd.get('category'),
        tags: fd.get('tags') ? fd.get('tags').split(/[,，]/).map(function(t){return t.trim()}).filter(Boolean) : [],
        rating: parseInt(fd.get('rating')) || 4,
        priceRange: fd.get('priceRange'),
        description: fd.get('description'),
        mustTry: fd.get('mustTry') ? fd.get('mustTry').split(/[,，]/).map(function(t){return t.trim()}).filter(Boolean) : [],
        tips: fd.get('tips'),
        photos: _editPhotos.slice(),
        branches: branches.map(function(b, i) {
            return {
                id: b.id || storeId + '_br' + i,
                name: b.name || fd.get('name'),
                address: b.address || '',
                district: b.district || '其他',
                lat: parseFloat(b.lat) || 34.7533,
                lng: parseFloat(b.lng) || 113.6654,
                openingHours: b.openingHours || '',
                phone: b.phone || '',
            };
        }),
    };

    authorEditStore(storeId, newData);
    closeSubPage();
    refreshStores();
    renderHome();
    updateSettingsCounts();
    showToast('✅ 修改已保存');
}

function generateCategoryOptions(current) {
    const cats = ['胡辣汤','烩面','豫菜','小吃','早餐','夜宵','烧烤','火锅','面食','甜点饮品','其他'];
    return cats.map(c => `<option value="${c}" ${c === current ? 'selected' : ''}>${c}</option>`).join('');
}

function generateDistrictOptions(current) {
    const districts = ['金水区','二七区','中原区','管城回族区','惠济区','郑东新区','高新区','经开区','航空港区','上街区','其他'];
    return districts.map(d => `<option value="${d}" ${d === current ? 'selected' : ''}>${d}</option>`).join('');
}

/* --- 用户评价 --- */

let pendingReviewRating = 5;

function initReviewStars(storeId) {
    const starsEl = document.getElementById('review-stars-' + storeId);
    if (!starsEl) return;
    pendingReviewRating = 5;

    starsEl.querySelectorAll('span').forEach(span => {
        span.addEventListener('click', function(e) {
            e.stopPropagation();
            pendingReviewRating = parseInt(this.dataset.star);
            updateStarDisplay(starsEl, pendingReviewRating);
        });
    });
    updateStarDisplay(starsEl, 5);
}

function updateStarDisplay(container, rating) {
    container.querySelectorAll('span').forEach(s => {
        s.textContent = parseInt(s.dataset.star) <= rating ? '⭐' : '☆';
    });
}

function submitReview(storeId) {
    const nickname = document.getElementById('review-nickname-' + storeId).value.trim() || '匿名吃货';
    const text = document.getElementById('review-text-' + storeId).value.trim();
    if (!text) { showToast('请输入评价内容'); return; }

    // 保存昵称
    Storage.setNickname(nickname);

    const review = {
        user: nickname,
        avatar: '😊',
        rating: pendingReviewRating,
        comment: text,
        date: new Date().toISOString().split('T')[0],
    };

    // 获取当前店铺数据
    const ad = getAuthorData();
    const store = findStoreById(storeId);
    if (!store) return;

    // 在作者数据中追加评价
    const existing = ad.editedStores[storeId] || {};
    const existingReviews = existing.reviews || store.reviews || [];
    existing.reviews = [...existingReviews, review];
    authorEditStore(storeId, existing);

    refreshStores();
    renderDetail(findStoreById(storeId));
    showToast('✅ 评价已提交！');
}

/* --- 辅助 --- */

function findStoreById(storeId) {
    return getMergedStores().find(s => s.id === storeId);
}
