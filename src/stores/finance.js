import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useFinanceStore = defineStore('finance', () => {
  // 模拟数据 - 后续会替换为真实解析的数据
  const transactions = ref([
    { id: 1, date: '2026-03-26', amount: -50, category: '餐饮', description: '午餐' },
    { id: 2, date: '2026-03-25', amount: -120, category: '交通', description: '打车' },
    { id: 3, date: '2026-03-25', amount: 5000, category: '工资', description: '月薪' },
    { id: 4, date: '2026-03-24', amount: -300, category: '购物', description: '衣服' },
    { id: 5, date: '2026-03-23', amount: -80, category: '餐饮', description: '晚餐' },
  ])

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

  return {
    transactions,
    totalIncome,
    totalExpense,
    balance,
    expensesByCategory
  }
})