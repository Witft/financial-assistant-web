/**
 * 微信账单解析器
 *
 * 微信 CSV 格式特点：
 * - 编码：UTF-8
 * - 列名：交易时间, 交易类型, 交易对方, 商品, 金额(元), 收/支 等
 * - 金额：全是负号，收支靠"收/支"列判断
 */

import { generateId } from './index'

/**
 * 解析微信 CSV
 * @param {string} csvText - CSV 内容
 * @returns {Array} 交易数据
 */
export function parseWechat(csvText) {
  const allLines = csvText.split('\n')

  // 找到真正的 CSV 表头（包含"交易时间"的行）
  let headerIndex = -1
  for (let i = 0; i < allLines.length; i++) {
    if (allLines[i].includes('交易时间') && allLines[i].includes('交易类型')) {
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

  console.log('微信表头行:', lines[0])

  // 解析表头
  const header = parseCSVLine(lines[0])
  const columnMap = getWechatColumnMap(header)

  // 解析数据行
  const transactions = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCSVLine(line)
    const transaction = parseWechatRow(values, columnMap)

    if (transaction) {
      transactions.push(transaction)
    }
  }

  return transactions
}

/**
 * 解析 CSV 行
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
 * 获取微信列索引映射
 */
function getWechatColumnMap(header) {
  const map = {}
  header.forEach((col, index) => {
    map[col] = index
  })
  return map
}

/**
 * 解析单行微信数据
 */
function parseWechatRow(values, columnMap) {
  try {
    // 获取各列数据
    const dateStr = values[columnMap['交易时间']] || ''
    const amountStr = values[columnMap['金额(元)']] || values[columnMap['金额']] || '0'
    const description = values[columnMap['商品']] || values[columnMap['交易对方']] || ''
    const tradeType = values[columnMap['交易类型']] || ''
    const payType = values[columnMap['收/支']] || ''

    // 跳过无效行
    if (!dateStr || amountStr === '0' || amountStr === '-') {
      return null
    }

    // 解析金额（微信金额全是负号）
    let amount = Math.abs(parseFloat(amountStr.replace(/[^0-9.]/g, '')))

    // 判断类型：优先信任"收/支"列，其次根据交易类型判断
    let transactionType = 'expense'
    if (payType === '支出') {
      transactionType = 'expense'
    } else if (payType === '收入') {
      transactionType = 'income'
    } else if (tradeType.includes('转账') || payType === '转账') {
      transactionType = 'transfer'
    } else if (tradeType.includes('红包')) {
      // 红包：发送是支出，接收是收入
      transactionType = 'expense'
    }
    // payType 为空时，根据 tradeType 推断

    // 支出金额应该是负数
    if (transactionType === 'expense') {
      amount = -amount
    }

    // 解析日期
    const date = parseDate(dateStr)

    // 分类
    const category = categorize(description, tradeType, transactionType)

    return {
      id: generateId(),
      date,
      amount,
      category,
      description,
      source: 'wechat',
      type: transactionType
    }
  } catch (e) {
    console.warn('解析行失败:', e)
    return null
  }
}

/**
 * 解析日期（微信格式：yyyy-MM-dd HH:mm:ss）
 */
function parseDate(dateStr) {
  // 处理 Excel 导出的日期格式
  if (/^\d+$/.test(dateStr)) {
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
 * 根据描述和交易类型自动分类
 */
function categorize(description, tradeType, type) {
  if (type === 'transfer') return '转账'
  if (type === 'income') return '收入'

  const desc = (description + tradeType).toLowerCase()

  if (desc.includes('餐饮') || desc.includes('吃饭') || desc.includes('外卖') || desc.includes('超市') || desc.includes('便利店') || desc.includes('美团')) {
    return '餐饮'
  }
  if (desc.includes('交通') || desc.includes('打车') || desc.includes('滴滴') || desc.includes('地铁') || desc.includes('公交') || desc.includes('停车')) {
    return '交通'
  }
  if (desc.includes('购物') || desc.includes('京东') || desc.includes('拼多多') || desc.includes('唯品会')) {
    return '购物'
  }
  if (desc.includes('电影') || desc.includes('娱乐') || desc.includes('游戏') || desc.includes('音乐')) {
    return '娱乐'
  }
  if (desc.includes('话费') || desc.includes('流量') || desc.includes('通信') || desc.includes('手机')) {
    return '通讯'
  }
  if (desc.includes('水电') || desc.includes('物业') || desc.includes('房租')) {
    return '住房'
  }
  if (desc.includes('医疗') || desc.includes('药店') || desc.includes('保险')) {
    return '医疗'
  }
  if (desc.includes('红包')) {
    return '人情'
  }

  return '其他'
}
