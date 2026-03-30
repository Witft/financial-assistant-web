<template>
  <div class="dashboard">
    <div class="container">
      <h1>📊 财务 Dashboard</h1>

      <!-- 顶部统计卡片 -->
      <div class="summary-cards">
        <div class="card income">
          <span class="label">收入</span>
          <span class="value">¥{{ financeStore.totalIncome.toLocaleString() }}</span>
        </div>
        <div class="card expense">
          <span class="label">支出</span>
          <span class="value">¥{{ financeStore.totalExpense.toLocaleString() }}</span>
        </div>
        <div class="card balance" :class="{ negative: financeStore.balance < 0 }">
          <span class="label">结余</span>
          <span class="value">¥{{ financeStore.balance.toLocaleString() }}</span>
        </div>
      </div>

      <!-- 分类统计 + 饼图 -->
      <div class="section">
        <h2>📈 支出构成</h2>
        <div class="chart-area">
          <div class="chart-wrapper">
            <v-chart :option="pieOption" autoresize style="height: 320px" />
          </div>
          <div class="category-list">
            <div
              v-for="item in financeStore.filteredExpensesByCategory"
              :key="item.name"
              class="category-item"
            >
              <span class="category-dot" :style="{ background: item.color }"></span>
              <span class="category-name">{{ item.name }}</span>
              <span class="category-amount">¥{{ item.value.toLocaleString() }}</span>
              <span class="category-pct">{{ item.pct }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 近期交易 -->
      <div class="section">
        <h2>📝 近期交易</h2>
        <div class="filter-row">
          <select v-model="financeStore.selectedMonth">
            <option value="">全部月份</option>
            <option v-for="month in monthOptions" :key="month" :value="month">
              {{ month }}
            </option>
          </select>
        </div>
        <div class="transaction-list">
          <div
            v-for="t in financeStore.filteredTransactions"
            :key="t.id"
            class="transaction-item"
            :class="{ income: t.amount > 0, expense: t.amount < 0 }"
          >
            <span class="t-date">{{ t.date }}</span>
            <span class="t-desc">{{ t.description }}</span>
            <span class="t-amount">{{ t.amount > 0 ? '+' : '' }}¥{{ t.amount }}</span>
          </div>
        </div>
      </div>

      <div class="nav">
        <router-link to="/" class="btn">← 返回上传</router-link>
        <button class="btn btn-danger" @click="handleClear">🗑️ 清空数据</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { useRouter } from 'vue-router'

const financeStore = useFinanceStore()
const router = useRouter()

// 动态生成月份选项（过去12个月）
const monthOptions = computed(() => {
  const months = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push(month)
  }
  return months
})

// 饼图配色
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#6BCB77'
]

// 饼图配置（基于筛选后的月份数据）
const pieOption = computed(() => {
  const data = financeStore.filteredExpensesByCategory
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { color: '#666', fontSize: 12 }
    },
    color: COLORS,
    series: [
      {
        name: '支出构成',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: data.map((d, i) => ({ ...d, itemStyle: { color: COLORS[i % COLORS.length] } }))
      }
    ]
  }
})

// 页面加载时从 storage 刷新最新数据
onMounted(() => {
  financeStore.refresh()
})

// 清空数据
function handleClear() {
  if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
    financeStore.clear()
    router.push('/')
  }
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  padding: 2rem;
  background: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 1.5rem;
  color: #333;
}

/* 统计卡片 */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card.income .value { color: #52c41a; }
.card.expense .value { color: #ff4d4f; }
.card.balance .value { color: #1890ff; }
.card.balance.negative .value { color: #ff4d4f; }

.card .label {
  font-size: 0.9rem;
  color: #666;
}

.card .value {
  font-size: 1.8rem;
  font-weight: bold;
}

/* 区块 */
.section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.section h2 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: #333;
}

/* 图表区域 */
.chart-area {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.chart-wrapper {
  flex: 0 0 320px;
  height: 320px;
}

/* 分类列表 */
.category-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-height: 320px;
  overflow-y: auto;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
  background: #fafafa;
  border-radius: 8px;
}

.category-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.category-name {
  flex: 1;
  color: #333;
  font-size: 0.9rem;
}

.category-amount {
  font-weight: bold;
  color: #ff4d4f;
  font-size: 0.9rem;
}

.category-pct {
  color: #999;
  font-size: 0.8rem;
  width: 40px;
  text-align: right;
}

/* 筛选行 */
.filter-row {
  margin-bottom: 1rem;
}

.filter-row select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #333;
  background: white;
  cursor: pointer;
}

/* 交易列表 */
.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.transaction-item {
  display: grid;
  grid-template-columns: 100px 1fr auto;
  gap: 1rem;
  padding: 0.75rem;
  background: #fafafa;
  border-radius: 8px;
  align-items: center;
}

.transaction-item.income .t-amount { color: #52c41a; }
.transaction-item.expense .t-amount { color: #ff4d4f; }

.t-date { color: #999; font-size: 0.9rem; }
.t-desc { color: #333; }
.t-amount { font-weight: bold; }

/* 按钮 */
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  margin-top: 1rem;
  margin-right: 1rem;
  transition: background 0.2s;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.btn:hover { background: #5a6fd6; }
.btn-danger { background: #ff4d4f; }
.btn-danger:hover { background: #ff7875; }
</style>
