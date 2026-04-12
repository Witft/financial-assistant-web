import type { AiDiagnosisResult } from "@/types/finance"

const API_BASE_URL = 'http://localhost:8000/api' // 假设你的 Python FastAPI 运行在本地 8000 端口

/**
 * 请求 AI 财务诊断建议
 * @param {Object} promptData - 从 financeStore 中获取的 aiPromptData
 * @returns {Promise<string>} - 大模型生成的 Markdown 文本
 */
export async function fetchAiDiagnosis(promptData: any): Promise<AiDiagnosisResult> {
  try {
    // 1. 发送 POST 请求到后端
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // 给后端的数据包
        financial_data: promptData,
        // 如果以后想加一些个性化设置，可以在这里补充，比如：
        // focus: '节流', tone: '严厉'
      })
    })

    // 2. 检查网络响应状态
    if (!response.ok) {
      throw new Error(`网络请求错误: ${response.status} ${response.statusText}`)
    }

    // 3. 解析 JSON 响应
    const data = (await response.json()) as AiDiagnosisResult

    return data

  } catch (error) {
    console.error("AI 分析接口调用失败:", error)
    throw error
  }
}

/**
 * 请求 AI 批量分类（Layer 2）
 * @param {string[]} descriptions - 商户描述列表（去重后）
 * @returns {Promise<Object>} - 返回映射 { "商户名": "分类", ... }
 */
export async function fetchAiCategories(descriptions) {
  try {
    const response = await fetch(`${API_BASE_URL}/categorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        descriptions
      })
    })

    if (!response.ok) {
      throw new Error(`AI 分类请求错误: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.success && data.mapping) {
      return data.mapping
    } else {
      throw new Error(data.detail || "AI 分类返回格式错误")
    }

  } catch (error) {
    console.error("AI 分类接口调用失败:", error)
    throw error
  }
}

/**
 * 上传并解析账单文件
 * @param {File} file - CSV 文件
 * @returns {Promise<Array>} - 解析后的交易数据
 */
export async function fetchParsedTransactions(file: File) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/parse`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`文件解析失败: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()

    if (data.success && Array.isArray(data.transactions)) {
      // 分类名称映射（后端英文 → 前端中文）
      const CATEGORY_MAPPING: Record<string, string> = {
        'family_support': '转账',
        'investment': '投资理财',
        'dining': '餐饮',
        'transportation': '交通',
        'fitness_health': '健身健康',
        'housing': '住房',
        'personal_care': '个人护理',
        'education': '教育',
        'healthcare': '医疗',
        'shopping': '购物',
        'entertainment': '娱乐',
        'other': '其他'
      }
      
      // 转换为前端期望的格式
      return data.transactions.map((tx: any) => ({
        id: tx.id,
        date: tx.date,
        amount: tx.amount,
        category: CATEGORY_MAPPING[tx.category] || tx.category,
        description: tx.description,
        source: tx.source,
        type: tx.type
      }))
    } else {
      throw new Error(data.message || "解析返回格式错误")
    }

  } catch (error) {
    console.error("文件解析 API 调用失败:", error)
    throw error
  }
}
