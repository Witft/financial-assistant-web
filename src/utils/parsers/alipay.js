/**
 * 支付宝账单解析器
 *
 * 支付宝 CSV 格式特点：
 * - 编码：GBK
 * - 列名：交易号, 交易创建时间, 商品说明, 金额, 收/支, 类型 等
 * - 金额：收入为正，支出为负
 */

import { generateId } from './index'

/**
 * 解析支付宝 CSV
 * @param {string} csvText - CSV 内容
 * @returns {Array} 交易数据
 */
export function parseAlipay(csvText) {
  const allLines = csvText.split('\n')

  // 找到真正的 CSV 表头（包含"交易时间"的行）
  let headerIndex = -1
  for (let i = 0; i < allLines.length; i++) {
    if (allLines[i].includes('交易时间') && allLines[i].includes('交易对方')) {
      headerIndex = i
      break
    }
  }

  if (headerIndex === -1) {
    throw new Error('未找到有效的 CSV 表头')
  }

  const lines = allLines.slice(headerIndex)
  if (lines.length < 2) {
    throw new Error('文件内容为空或格式不正确')
  }

  // 解析表头
  const header = parseCSVLine(lines[0])
  const columnMap = getAlipayColumnMap(header)
  console.log('支付宝表头:', header)

  // 解析数据行
  const transactions = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCSVLine(line)
    const transaction = parseAlipayRow(values, columnMap)

    if (transaction) {
      transactions.push(transaction)
    }
  }

  return transactions
}

/**
 * 解析 CSV 行（处理引号内的逗号）
 */
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())

  return result
}

/**
 * 获取支付宝列索引映射
 */
function getAlipayColumnMap(header) {
  const map = {}
  header.forEach((col, index) => {
    map[col] = index
  })
  return map
}

/**
 * 解析单行支付宝数据
 */
function parseAlipayRow(values, columnMap) {
  try {
    // 获取各列数据
    const dateStr = values[columnMap['交易时间']] || values[columnMap['交易创建时间']] || ''
    const amountStr = values[columnMap['金额']] || '0'
    const description = values[columnMap['商品说明']] || values[columnMap['交易对方']] || ''
    const type = values[columnMap['收/支']] || ''
    const tradeType = values[columnMap['交易状态']] || values[columnMap['状态']] || ''
    const categoryFromCSV = values[columnMap['交易分类']] || ''

    // 跳过无效行
    if (!dateStr || amountStr === '0' || amountStr === '-') {
      return null
    }

    // 解析金额
    let amount = parseFloat(amountStr.replace(/,/g, ''))

    // 判断类型：收入/支出/转账
    let transactionType = 'transfer'
    if (type === '收入') {
      transactionType = 'income'
      amount = Math.abs(amount)
    } else if (type === '支出') {
      transactionType = 'expense'
    } else if (tradeType.includes('转账') || type === '转账') {
      transactionType = 'transfer'
    }

    // 解析日期
    const date = parseDate(dateStr)

    // 分类：优先使用 CSV 中的分类，没有则自动识别
    const category = categoryFromCSV || categorize(description, transactionType)

    return {
      id: generateId(),
      date,
      amount: transactionType === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      category,
      description,
      source: 'alipay',
      type: transactionType
    }
  } catch (e) {
    console.warn('解析行失败:', e)
    return null
  }
}

/**
 * 解析日期（支付宝格式：yyyy-MM-dd HH:mm:ss）
 */
function parseDate(dateStr) {
  // 处理 Excel 导出的日期格式（可能是序列号）
  if (/^\d+$/.test(dateStr)) {
    // Excel 日期序列号
    const excelDate = parseInt(dateStr)
    const date = new Date((excelDate - 25569) * 86400 * 1000)
    return date.toISOString().split('T')[0]
  }

  // 正常日期格式
  const match = dateStr.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
  }

  return new Date().toISOString().split('T')[0]
}

/**
 * 根据描述自动分类
 */
function categorize(description, type) {
  if (type === 'transfer') return '转账'
  if (type === 'income') return '收入'

  const desc = description.toLowerCase()

  if (desc.includes('餐饮') || desc.includes('吃饭') || desc.includes('外卖') || desc.includes('超市')) {
    return '餐饮'
  }
  if (desc.includes('交通') || desc.includes('打车') || desc.includes('地铁') || desc.includes('公交') || desc.includes('停车')) {
    return '交通'
  }
  if (desc.includes('购物') || desc.includes('淘宝') || desc.includes('天猫') || desc.includes('京东')) {
    return '购物'
  }
  if (desc.includes('电影') || desc.includes('娱乐') || desc.includes('游戏')) {
    return '娱乐'
  }
  if (desc.includes('话费') || desc.includes('流量') || desc.includes('通信')) {
    return '通讯'
  }
  if (desc.includes('水电') || desc.includes('物业') || desc.includes('房租')) {
    return '住房'
  }
  if (desc.includes('医疗') || desc.includes('药店') || desc.includes('保险')) {
    return '医疗'
  }

  return '其他'
}
