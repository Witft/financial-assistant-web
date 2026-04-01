<template>
  <div class="dashboard">
    <div class="container">
      <h1>📊 财务 Dashboard</h1>

      <!-- 顶部统计卡片 -->
      <SummaryCards 
        :total-income="financeStore.totalIncome"
        :total-expense="financeStore.totalExpense"
        :balance="financeStore.balance"
      />

      <!-- 分类统计 + 饼图 -->
      <div class="section">
        <h2>📈 支出构成</h2>
        <div class="chart-area">
          <ExpenseChart :data="financeStore.filteredExpensesByCategory" />
          <CategoryList :categories="financeStore.filteredExpensesByCategory" />
        </div>
      </div>

      <!-- 近期交易 -->
      <div class="section">
        <h2>📝 近期交易</h2>
        <MonthFilter v-model="financeStore.selectedMonth" />
        <TransactionList :transactions="financeStore.filteredTransactions" />
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

// 组件导入
import SummaryCards from '@/components/SummaryCards.vue'
import ExpenseChart from '@/components/ExpenseChart.vue'
import CategoryList from '@/components/CategoryList.vue'
import TransactionList from '@/components/TransactionList.vue'
import MonthFilter from '@/components/MonthFilter.vue'

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