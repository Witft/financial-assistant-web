import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getTransactions, clearTransactions, getCategoryCache, updateCategoryCache } from '@/utils/storage'
import { fetchAiCategories } from '@/utils/api'

export const useFinanceStore = defineStore('finance', () => {
  const transactions = ref(getTransactions() || [])
  const selectedMonth = ref('')

  // 筛选后的交易
  const filteredTransactions = computed(() => {
    if (!selectedMonth.value) return transactions.value
    return transactions.value.filter(t => t.date.startsWith(selectedMonth.value))
  })

  // 计算收入（只计算 type === 'income' 的记录）
  const totalIncome = computed(() =>
    filteredTransactions.value
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  )

  // 计算支出（只计算 type === 'expense' 的记录）
  const totalExpense = computed(() =>
    filteredTransactions.value
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  )

  // 计算结余
  const balance = computed(() => totalIncome.value - totalExpense.value)

  // 按分类统计支出（含百分比，用于饼图和列表）
  const filteredExpensesByCategory = computed(() => {
    const map = {}
    filteredTransactions.value
      .filter(t => t.amount < 0)
      .forEach(t => {
        if (!map[t.category]) map[t.category] = 0
        map[t.category] += Math.abs(t.amount)
      })

    const total = Object.values(map).reduce((s, v) => s + v, 0)
    const COLORS = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#BB8FCE', '#85C1E9', '#F8B500', '#6BCB77'
    ]
    return Object.entries(map)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length],
        pct: total > 0 ? Math.round((value / total) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value)
  })

  // 组装用于 AI 诊断的"脱水"核心数据
  const aiPromptData = computed(() => {
    // 1. 获取前三名最大单笔支出
    const topExpenses = [...filteredTransactions.value]
      .filter(t => t.amount < 0)
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 3)
      .map(t => ({
        date: t.date,
        category: t.category,
        amount: Math.abs(t.amount).toFixed(2),
        desc: t.description || t.counterparty || t.item || '无明细'
      }))

    // 2. 获取前三名支出分类
    const topCategories = filteredExpensesByCategory.value
      .slice(0, 3)
      .map(c => ({
        name: c.name,
        amount: c.value.toFixed(2),
        pct: `${c.pct}%`
      }))

    // 3. 组装精简版 JSON
    return {
      month: selectedMonth.value || '全部历史',
      summary: {
        income: totalIncome.value.toFixed(2),
        expense: totalExpense.value.toFixed(2),
        balance: balance.value.toFixed(2)
      },
      top_categories: topCategories,
      top_expenses: topExpenses
    }
  })

  // 从 storage 刷新数据
  function refresh() {
    transactions.value = getTransactions() || []
  }

  // 清空所有数据
  function clear() {
    clearTransactions()
    transactions.value = []
  }

  // ==========================================
  // 三层分类增强（Layer 1 + 2 + 3）
  // ==========================================

  /**
   * 增强分类：基础关键词（已在 parse 层完成）+ 缓存查询 + AI 推断
   * @returns {Promise<boolean>} 是否进行了 AI 调用
   */
  async function enhanceCategories() {
    // 1. 找出被标记为"其他"的交易
    const uncategorized = transactions.value.filter(t => 
      t.category === '其他' && t.type === 'expense'
    )
    
    if (uncategorized.length === 0) {
      console.log('✅ 没有需要分类的"其他"交易')
      return false
    }
    
    console.log(`🔍 发现 ${uncategorized.length} 条"其他"交易，尝试分类...`)
    
    // 2. 从缓存中查找（Layer 3）
    const cache = getCategoryCache()
    const mapping = {}
    const toAiList = []
    
    for (const t of uncategorized) {
      // 优先用 description，其次用 counterparty
      const key = t.description || t.counterparty || ''
      if (key && cache[key]) {
        mapping[key] = cache[key] // 命中缓存
      } else if (key) {
        toAiList.push(key) // 加入 AI 待处理列表
      }
    }
    
    // 3. 如果有待处理的，调用 AI（Layer 2）
    if (toAiList.length > 0) {
      try {
        // 去重
        const uniqueList = [...new Set(toAiList)]
        console.log(`🤖 调用 AI 分类 ${uniqueList.length} 个商户...`)
        
        const aiResult = await fetchAiCategories(uniqueList)
        
        // 合并结果
        Object.assign(mapping, aiResult)
        
        // 更新缓存
        if (Object.keys(aiResult).length > 0) {
          updateCategoryCache(aiResult)
          console.log(`💾 已更新分类缓存`)
        }
      } catch (e) {
        console.error('AI 分类失败:', e)
        // AI 失败不影响主流程，只是这批交易仍是"其他"
      }
    }
    
    // 4. 应用分类结果（更新 transactions）
    let updatedCount = 0
    transactions.value = transactions.value.map(t => {
      if (t.category === '其他' && t.type === 'expense') {
        const key = t.description || t.counterparty || ''
        if (key && mapping[key]) {
          updatedCount++
          return { ...t, category: mapping[key] }
        }
      }
      return t
    })
    
    // 5. 保存更新后的数据
    if (updatedCount > 0) {
      const { saveTransactions } = await import('@/utils/storage')
      saveTransactions(transactions.value)
      console.log(`✅ 成功分类 ${updatedCount} 条交易`)
    }
    
    return toAiList.length > 0
  }

  return {
    transactions,
    selectedMonth,
    filteredTransactions,
    totalIncome,
    totalExpense,
    balance,
    filteredExpensesByCategory,
    aiPromptData,
    refresh,
    clear,
    enhanceCategories
  }
})