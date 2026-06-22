// 一键发布 — 将作者修改直接推送到 GitHub，触发 Netlify 自动部署
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { stores, message } = req.body;
        if (!stores || !Array.isArray(stores)) {
            return res.status(400).json({ error: '数据格式错误' });
        }

        const token = process.env.GH_TOKEN;
        const repo = process.env.GH_REPO || 'FairyMario/food';
        const branch = process.env.GH_BRANCH || 'master';

        if (!token) {
            return res.status(500).json({ error: '未配置 GH_TOKEN 环境变量' });
        }

        // 构建新的 foods.json
        const foodsJson = JSON.stringify({
            stores: stores,
            lastUpdated: new Date().toISOString().split('T')[0],
        }, null, 2);

        // 获取当前文件的 SHA
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
            return res.status(200).json({ success: true, message: '发布成功！1分钟后全网更新' });
        } else {
            const err = await updateResp.text();
            console.error('GitHub API 失败:', err);
            return res.status(500).json({ error: 'GitHub 更新失败: ' + err.slice(0, 200) });
        }
    } catch (e) {
        console.error('发布异常:', e);
        return res.status(500).json({ error: e.message });
    }
}
