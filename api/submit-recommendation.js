/* ============================================
   Vercel Serverless Function
   接收用户推荐提交
   ============================================ */

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const data = req.body;

        // 基本验证
        if (!data.name || !data.address || !data.reason) {
            return res.status(400).json({ error: '请填写必填字段' });
        }

        // 记录提交时间
        data.receivedAt = new Date().toISOString();

        // 输出到 Vercel 日志（作者可以在 Vercel Dashboard 查看）
        console.log('=== 新的美食推荐 ===');
        console.log(JSON.stringify(data, null, 2));
        console.log('====================');

        // 可选：发送到 GitHub Issue（需要配置 GITHUB_TOKEN 环境变量）
        if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPO) {
            try {
                const issueBody = [
                    `## 美食推荐`,
                    `- **店铺名称**：${data.name}`,
                    `- **所在区域**：${data.district || '未填写'}`,
                    `- **详细地址**：${data.address}`,
                    `- **美食分类**：${data.category || '未填写'}`,
                    `- **推荐理由**：${data.reason}`,
                    `- **推荐人**：${data.nickname || '匿名'}`,
                    `- **提交时间**：${data.receivedAt}`,
                ].join('\n');

                const issueTitle = `[美食推荐] ${data.name} - ${data.district || '未知区域'}`;

                const ghResp = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPO}/issues`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json',
                    },
                    body: JSON.stringify({
                        title: issueTitle,
                        body: issueBody,
                        labels: ['用户推荐', '待审核'],
                    }),
                });

                if (!ghResp.ok) {
                    console.error('GitHub Issue 创建失败:', await ghResp.text());
                }
            } catch (ghErr) {
                console.error('GitHub 调用异常:', ghErr);
            }
        }

        return res.status(200).json({
            success: true,
            message: '推荐已提交，感谢你的贡献！',
        });
    } catch (err) {
        console.error('提交处理失败:', err);
        return res.status(500).json({ error: '服务器处理失败，请稍后再试' });
    }
}
