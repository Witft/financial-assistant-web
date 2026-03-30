import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getTransactions, clearTransactions } from '@/utils/storage'

export const useFinanceStore = defineStore('finance', () => {
  const transactions = ref(getTransactions() || [])
  const selectedMonth = ref('')

  // 筛选后的交易
  const filteredTransactions = computed(() => {
    if (!selectedMonth.value) return transactions.value
    return transactions.value.filter(t => t.date.startsWith(selectedMonth.value))
  })

  // 计算收入
  const totalIncome = computed(() =>
    filteredTransactions.value
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
  )

  // 计算支出
  const totalExpense = computed(() =>
    filteredTransactions.value
      .filter(t => t.amount < 0)
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
    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value)
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

  return {
    transactions,
    selectedMonth,
    filteredTransactions,
    totalIncome,
    totalExpense,
    balance,
    filteredExpensesByCategory,
    refresh,
    clear
  }
})
