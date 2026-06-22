// 一键发布 — 将作者修改推送到 GitHub，触发 Netlify 自动部署
export default async function handler(req) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers });
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

    try {
        const body = await req.json();
        const { stores, message } = body;
        if (!stores || !Array.isArray(stores)) {
            return new Response(JSON.stringify({ error: '数据格式错误' }), { status: 400, headers });
        }

        const token = process.env.GH_TOKEN;
        const repo = process.env.GH_REPO || 'FairyMario/food';
        const branch = 'master';

        if (!token) {
            return new Response(JSON.stringify({ error: '未配置 GH_TOKEN' }), { status: 500, headers });
        }

        const foodsJson = JSON.stringify({
            stores: stores,
            lastUpdated: new Date().toISOString().split('T')[0],
        }, null, 2);

        // 获取 SHA
        const fileUrl = `https://api.github.com/repos/${repo}/contents/data/foods.json?ref=${branch}`;
        const existing = await fetch(fileUrl, {
            headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' },
        });

        let sha = null;
        if (existing.ok) {
            const info = await existing.json();
            sha = info.sha;
        }

        // 更新文件
        const updateResp = await fetch(fileUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message || '📝 作者一键发布更新',
                content: Buffer.from(foodsJson).toString('base64'),
                sha: sha,
                branch: branch,
            }),
        });

        if (updateResp.ok) {
            return new Response(JSON.stringify({ success: true, message: '发布成功！1分钟后全网更新' }), { status: 200, headers });
        } else {
            const err = await updateResp.text();
            return new Response(JSON.stringify({ error: 'GitHub 更新失败: ' + err.slice(0, 200) }), { status: 500, headers });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
}

// Netlify Function: 一键发布美食数据
