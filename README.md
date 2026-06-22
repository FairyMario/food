# 郑州美食地图 🍜

> 发现郑州最地道的美食，让朋友来郑州时不再为"吃什么"发愁。

## 📱 体验方式

1. 用手机浏览器打开网站链接
2. 浏览器会提示「添加到主屏幕」，点击添加
3. 之后就像使用 App 一样，点图标即开

## 🔄 如何更新内容

所有美食数据存放在 `data/foods.json` 文件中。添加新店铺只需三步：

### 方法一：在线编辑（最简单，无需装任何软件）

1. 在 GitHub 上打开 `data/foods.json` 文件
2. 点击右上角的 ✏️ 编辑按钮
3. 复制一条已有记录，修改内容后保存
4. 照片上传到 `images/` 文件夹
5. 保存后 **1 分钟内自动上线**

### 方法二：本地编辑

1. 用任意文本编辑器打开 `data/foods.json`
2. 复制一条已有记录，修改内容
3. 照片放入 `images/` 文件夹
4. 推送到 GitHub → 自动部署

### 数据格式

```json
{
  "id": "唯一的英文ID",
  "name": "店铺名称",
  "category": "分类（见下方分类列表）",
  "tags": ["标签1", "标签2"],
  "rating": 5,
  "priceRange": "10-20元",
  "description": "店铺介绍",
  "mustTry": ["必点菜1", "必点菜2"],
  "photos": ["images/照片名.jpg"],
  "tips": "小贴士",
  "branches": [
    {
      "id": "分店唯一ID",
      "name": "分店名称",
      "address": "详细地址",
      "district": "所在区",
      "lat": 34.7569,
      "lng": 113.6831,
      "openingHours": "06:00-14:00",
      "phone": "电话"
    }
  ],
  "reviews": [
    {
      "user": "昵称",
      "avatar": "😊",
      "rating": 5,
      "comment": "评价内容",
      "date": "2024-01-15"
    }
  ]
}
```

### 分类列表

`胡辣汤` | `烩面` | `豫菜` | `小吃` | `早餐` | `夜宵` | `烧烤` | `火锅` | `面食` | `甜点饮品` | `其他`

### 行政区划

`金水区` | `二七区` | `中原区` | `管城回族区` | `惠济区` | `郑东新区` | `高新区` | `经开区` | `航空港区` | `上街区`

## 🔧 技术说明

- **纯静态网站**：HTML + CSS + JavaScript，零框架依赖
- **地图**：高德地图 JS API 2.0
- **托管**：Vercel（免费）
- **PWA**：支持离线访问、添加到主屏幕

## 🔑 高德地图 Key 配置

1. 前往 [高德开放平台](https://lbs.amap.com/) 注册账号
2. 创建应用 → 添加 Key（服务平台选择「Web端(JS API)」）
3. 在 `index.html` 中将 `YOUR_AMAP_KEY` 替换为你的 Key

## 🚀 部署到 Vercel

1. 将此仓库推送到 GitHub
2. 在 [Vercel](https://vercel.com) 用 GitHub 账号登录
3. 点击「New Project」→ 选择此仓库 → 直接 Deploy
4. 获得一个 `https://xxx.vercel.app` 的链接，发给朋友即可

## 📋 用户推荐审核流程

1. 用户在设置页的「用户推荐」中提交美食推荐
2. 推荐数据会创建为 GitHub Issue（需配置 `GITHUB_TOKEN` 和 `GITHUB_REPO` 环境变量）
3. 作者审核通过后，手动添加到 `foods.json`
4. 也可以选择直接查看 Vercel 日志获取推荐内容

## 📝 PWA 图标生成

在部署前，建议生成 PWA 图标：
1. 使用 [PWA Icon Generator](https://www.pwabuilder.com/imagegenerator) 等在线工具
2. 上传一张 512x512 的图标
3. 将生成的 `icon-192.png` 和 `icon-512.png` 放入 `images/` 目录
4. 也可以暂时使用 `images/icon.svg`（部分浏览器支持 SVG 图标）

## 📄 License

MIT
