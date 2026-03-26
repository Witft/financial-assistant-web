/**
 * 交易数据解析器入口
 * 自动识别 CSV 来源（支付宝/微信）
 */

import { parseAlipay } from './alipay'
import { parseWechat } from './wechat'

/**
 * 解析交易数据
 * @param {string} csvText - CSV 文件内容
 * @param {string} fileName - 文件名（用于辅助识别）
 * @returns {Array} 交易数据数组
 */
export function parseTransactions(csvText, fileName) {
  // 简单检查判断来源
  const isAlipay = detectSource(csvText, fileName)
  
  if (isAlipay) {
    return parseAlipay(csvText)
  } else {
    return parseWechat(csvText)
  }
}

/**
 * 自动识别 CSV 来源
 */
function detectSource(csvText, fileName) {
  // 根据文件名判断
  const lowerName = fileName.toLowerCase()
  if (lowerName.includes('alipay') || lowerName.includes('支付宝')) {
    return true
  }
  if (lowerName.includes('wechat') || lowerName.includes('微信')) {
    return false
  }
  
  // 根据内容特征判断
  const firstLine = csvText.split('\n')[0]
  
  // 支付宝特征列
  if (firstLine.includes('交易号') && firstLine.includes('商品说明')) {
    return true
  }
  
  // 微信特征列
  if (firstLine.includes('交易时间') && firstLine.includes('交易类型')) {
    return false
  }
  
  // 默认按支付宝处理
  return true
}

/**
 * 生成唯一ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}