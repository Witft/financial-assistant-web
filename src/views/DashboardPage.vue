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

      <!-- === ✨ AI 财务诊断卡片 === -->
      <div class="ai-card section">
        <div class="ai-header" @click="handleGetAiDiagnosis">
          <h2>✨ AI 深度财务诊断</h2>
          <button class="btn-ai" :disabled="isAiLoading">
            {{ isAiLoading ? '🧠 AI 疯狂计算中...' : '💡 一键获取分析建议' }}
          </button>
        </div>
        <!-- AI 分析结果展示区域 -->
        <div v-if="aiResult || isAiLoading" class="ai-content">
          <div v-if="isAiLoading" class="loading-text">正在分析你的收支数据，请稍候...</div>
          <div v-else class="markdown-body" v-html="aiResult"></div>
        </div>
      </div>

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
import { ref, onMounted } from 'vue'
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

// === AI 诊断相关状态 ===
const isAiLoading = ref(false)
const aiResult = ref('')

async function handleGetAiDiagnosis() {
  if (isAiLoading.value) return // 防抖，防止重复点击
  
  isAiLoading.value = true
  aiResult.value = '' // 清空旧数据
  
  try {
    // 【Mock 数据】因为 Python 后端还没起，先用 setTimeout 假装发请求
    // 以后这里会换成： aiResult.value = await fetchAiDiagnosis(financeStore.aiPromptData)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 返回假的 HTML 内容模拟 Markdown 解析后的结果
    aiResult.value = `
      <h3 style="margin-top:0;">🤖 你的本月财务诊断报告出炉啦：</h3>
      <p>💡 <b>总体评价</b>：你这个月的收支比较健康，结余良好！</p>
      <ul>
        <li>📉 <b>可优化项</b>：餐饮支出占总支出的 35%，略高于你的历史平均水平。建议周末可以尝试自己做饭哦。</li>
        <li>📈 <b>亮点</b>：没有大额冲动消费，储蓄率达到了 40%！继续保持。</li>
      </ul>
      <p style="color: #718096; font-size: 0.9em;">
        <i>（* 注：目前是假数据占位。等我们用 Python 接入 Gemini 2.5 后，这里就会显示真实的 AI 分析啦~）</i>
      </p>
    `
  } catch (err) {
    aiResult.value = `<p style="color: red;">获取诊断失败: ${err.message}</p>`
  } finally {
    isAiLoading.value = false
  }
}

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

/* === AI 诊断卡片专属样式 === */
.ai-card {
  background: linear-gradient(135deg, #f8faff 0%, #edf2fe 100%);
  border-left: 5px solid #667eea;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-header h2 {
  margin-bottom: 0;
  color: #4a5568;
}

.btn-ai {
  padding: 0.6rem 1.2rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(102, 126, 234, 0.2);
}

.btn-ai:hover:not(:disabled) {
  background: #5a6fd6;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(102, 126, 234, 0.3);
}

.btn-ai:disabled {
  background: #a0aec0;
  cursor: not-allowed;
  box-shadow: none;
}

.ai-content {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px dashed #cbd5e0;
  color: #2d3748;
  line-height: 1.6;
}

.loading-text {
  color: #667eea;
  font-weight: bold;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>