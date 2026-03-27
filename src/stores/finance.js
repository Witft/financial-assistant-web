import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getTransactions } from '@/utils/storage'

export const useFinanceStore = defineStore('finance', () => {
  // 从 localStorage 加载真实数据，没有则为空数组
  const transactions = ref(getTransactions() || [])

  // 计算收入
  const totalIncome = computed(() => {
    return transactions.value
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
  })

  // 计算支出
  const totalExpense = computed(() => {
    return transactions.value
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  })

  // 计算结余
  const balance = computed(() => totalIncome.value - totalExpense.value)

  // 按分类统计支出
  const expensesByCategory = computed(() => {
    const categoryMap = {}
    transactions.value
      .filter(t => t.amount < 0)
      .forEach(t => {
        if (!categoryMap[t.category]) {
          categoryMap[t.category] = 0
        }
        categoryMap[t.category] += Math.abs(t.amount)
      })
    return categoryMap
  })

  // 从 storage 刷新数据（页面跳转后调用）
  function refresh() {
    transactions.value = getTransactions() || []
  }

  return {
    transactions,
    totalIncome,
    totalExpense,
    balance,
    expensesByCategory,
    refresh
  }
})