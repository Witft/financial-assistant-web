import type { Transaction } from '@/types/finance'

/**
 * localStorage 存储工具
 */

const STORAGE_KEY = 'financial_assistant_transactions'
const CATEGORY_CACHE_KEY = 'financial_assistant_category_cache'

export type CategoryCache = Record<string, string>

/**
 * 保存交易数据
 */
export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  } catch (e) {
    console.error('保存数据失败:', e)
    throw new Error('数据保存失败', { cause: e })
  }
}

/**
 * 获取交易数据
 */
export function getTransactions(): Transaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? (JSON.parse(data) as Transaction[]) : []
  } catch (e) {
    console.error('读取数据失败:', e)
    return []
  }
}

/**
 * 清除交易数据
 */
export function clearTransactions(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 获取指定月份的数据
 */
export function getTransactionsByMonth(month: string): Transaction[] {
  const all = getTransactions()
  return all.filter(t => t.date.startsWith(month))
}

/**
 * 获取最新数据，按日期排序
 */
export function getLatestTransactions(limit = 10): Transaction[] {
  const all = getTransactions()
  return all
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
}

// ==========================================
// AI 分类缓存相关（Layer 3）
// ==========================================

/**
 * 获取分类缓存
 *
 * 结构示例：
 * {
 *   "星巴克": "餐饮",
 *   "滴滴出行": "交通"
 * }
 */
export function getCategoryCache(): CategoryCache {
  try {
    const data = localStorage.getItem(CATEGORY_CACHE_KEY)
    return data ? (JSON.parse(data) as CategoryCache) : {}
  } catch (e) {
    console.error('读取分类缓存失败:', e)
    return {}
  }
}

/**
 * 保存分类缓存
 */
export function saveCategoryCache(cache: CategoryCache): void {
  try {
    localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(cache))
  } catch (e) {
    console.error('保存分类缓存失败:', e)
  }
}

/**
 * 批量更新分类缓存
 */
export function updateCategoryCache(mapping: CategoryCache): void {
  const existingCategoryByDescription = getCategoryCache()
  const nextCategoryByDescription: CategoryCache = {
    ...existingCategoryByDescription,
    ...mapping,
  }
  saveCategoryCache(nextCategoryByDescription)
}

/**
 * 清除分类缓存
 */
export function clearCategoryCache(): void {
  localStorage.removeItem(CATEGORY_CACHE_KEY)
}
