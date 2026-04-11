/**
 * localStorage 存储工具
 */

const STORAGE_KEY = 'financial_assistant_transactions'
const CATEGORY_CACHE_KEY = 'financial_assistant_category_cache' // AI 分类缓存

/**
 * 保存交易数据
 * @param {Array} transactions - 交易数据数组
 */
export function saveTransactions(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
  } catch (e) {
    console.error('保存数据失败:', e)
    throw new Error('数据保存失败', { cause: e })
  }
}

/**
 * 获取交易数据
 * @returns {Array} 交易数据数组
 */
export function getTransactions() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('读取数据失败:', e)
    return []
  }
}

/**
 * 清除交易数据
 */
export function clearTransactions() {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 获取指定月份的数据
 * @param {string} month - 月份（YYYY-MM）
 * @returns {Array} 交易数据
 */
export function getTransactionsByMonth(month) {
  const all = getTransactions()
  return all.filter(t => t.date.startsWith(month))
}

/**
 * 获取最新数据（按日期排序）
 * @param {number} limit - 返回条数
 * @returns {Array}
 */
export function getLatestTransactions(limit = 10) {
  const all = getTransactions()
  return all
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit)
}

// ==========================================
// AI 分类缓存相关（Layer 3）
// ==========================================

/**
 * 获取分类缓存
 * @returns {Object} { "商户描述": "分类", ... }
 */
export function getCategoryCache() {
  try {
    const data = localStorage.getItem(CATEGORY_CACHE_KEY)
    return data ? JSON.parse(data) : {}
  } catch (e) {
    console.error('读取分类缓存失败:', e)
    return {}
  }
}

/**
 * 保存分类缓存
 * @param {Object} cache - 分类映射对象
 */
export function saveCategoryCache(cache) {
  try {
    localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(cache))
  } catch (e) {
    console.error('保存分类缓存失败:', e)
  }
}

/**
 * 批量更新分类缓存
 * @param {Object} mapping - { "商户描述": "分类", ... }
 */
export function updateCategoryCache(mapping) {
  const cache = getCategoryCache()
  const updated = { ...cache, ...mapping }
  saveCategoryCache(updated)
}

/**
 * 清除分类缓存
 */
export function clearCategoryCache() {
  localStorage.removeItem(CATEGORY_CACHE_KEY)
}