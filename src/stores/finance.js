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
    clear
  }
})