# CLAUDE.md

个人财务助手前端项目，基于 Vue 3 + Vite 构建。

## 项目概述

前端调用后端 API 进行账单解析、分类和 AI 诊断，数据存储在 localStorage。

## 技术栈

- Vue 3 + Composition API
- Vite
- Pinia (状态管理)
- Vue Router
- ECharts (图表)
- TypeScript

## 项目结构

```
src/
├── main.js                    # 应用入口
├── App.vue                   # 根组件
├── router/index.js          # 路由配置
├── stores/
│   └── finance.ts           # 核心状态管理
├── utils/
│   ├── api.ts               # 调用后端 API
│   └── storage.ts           # localStorage 工具
├── types/
│   └── finance.ts          # TypeScript 类型定义
├── views/
│   ├── UploadPage.vue       # 文件上传页
│   ├── DashboardPage.vue    # Dashboard 展示页
│   └── ReviewPage.vue      # 分类审核页
└── components/
    ├── SummaryCards.vue     # 收支统计卡片
    ├── ExpenseChart.vue     # 支出饼图 (ECharts)
    ├── CategoryList.vue    # 分类列表
    ├── TransactionList.vue  # 交易列表
    └── MonthFilter.vue     # 月份筛选器
```

## 业务流程

### 1. 文件上传 → 解析

```
用户上传 CSV/Excel 文件
    ↓
UploadPage.processFile()
    ↓ (xlsx 库转 CSV)
fetchParsedTransactions(file)  ← api.ts
    ↓ POST /api/parse
后端 parse_csv_content() 解析
    ↓
返回 transactions[] (已含分类)
    ↓
saveTransactions() → localStorage
```

### 2. 分类增强 (三层)

```
enhanceCategories()
    ↓
Layer 1: 后端已用关键词分类
    ↓
Layer 2: 遍历 uncategorized (category='其他')
    ↓
getCategoryCache() → 检查缓存
    ↓ 未命中
fetchAiCategories()  ← api.ts POST /api/categorize
    ↓ AI 推断
updateCategoryCache() → localStorage
    ↓
saveTransactions() 更新后的 transactions
```

### 3. Dashboard 展示

```
DashboardPage
    ↓
financeStore.totalIncome / totalExpense / balance  ← computed
    ↓
financeStore.filteredExpensesByCategory  ← 按 category 分组统计
    ↓
SummaryCards (收支结余)
ExpenseChart (ECharts 饼图)
CategoryList (分类列表)
TransactionList (交易明细)
MonthFilter → financeStore.selectedMonth 筛选月份
```

### 4. AI 财务诊断

```
DashboardPage.handleGetAiDiagnosis()
    ↓
financeStore.aiPromptData  ← 组装精简数据
    ↓
fetchAiDiagnosis()  ← api.ts POST /api/analyze
    ↓
返回 Markdown 格式诊断报告
```

### 5. 分类审核

```
pendingReviews = transactions.filter(t => t.category === '其他')
    ↓
ReviewPage 用户手动选择分类
    ↓
financeStore.updateTransactionCategory(id, category)
    ↓
saveTransactions() + updateCategoryCache()
```

## 后端 API 端点

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/parse` | POST | 解析 CSV 文件 |
| `/api/categorize` | POST | AI 批量分类 |
| `/api/analyze` | POST | AI 财务诊断 |

## localStorage 结构

```javascript
// 交易数据
'financial_assistant_transactions': Transaction[]

// 分类缓存 (description → category)
'financial_assistant_category_cache': Record<string, string>
```

## 分类选项

`餐饮、交通、购物、学习、娱乐、通讯、住房、医疗、人情、转账、收入、其他`

## 开发命令

```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 环境要求

- 后端 API 运行在 `http://localhost:8000`
- 需要启用 CORS 支持
