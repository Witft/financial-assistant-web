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

      <!-- 分类统计 -->
      <div class="section">
        <h2>📈 支出分类</h2>
        <div class="category-list">
          <div 
            v-for="(amount, category) in financeStore.expensesByCategory" 
            :key="category"
            class="category-item"
          >
            <span class="category-name">{{ category }}</span>
            <span class="category-amount">¥{{ amount.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- 近期交易 -->
      <div class="section">
        <h2>📝 近期交易</h2>
        <div class="transaction-list">
          <div 
            v-for="t in financeStore.transactions" 
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
import { onMounted } from 'vue'
import { useFinanceStore } from '@/stores/finance'
import { useRouter } from 'vue-router'

const financeStore = useFinanceStore()
const router = useRouter()

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
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 1.5rem;
}

.section h2 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: #333;
}

/* 分类列表 */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: #fafafa;
  border-radius: 8px;
}

.category-name {
  color: #333;
}

.category-amount {
  font-weight: bold;
  color: #ff4d4f;
}

/* 交易列表 */
.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

.t-date {
  color: #999;
  font-size: 0.9rem;
}

.t-desc {
  color: #333;
}

.t-amount {
  font-weight: bold;
}

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

.btn:hover {
  background: #5a6fd6;
}

.btn-danger {
  background: #ff4d4f;
}

.btn-danger:hover {
  background: #ff7875;
}
</style>