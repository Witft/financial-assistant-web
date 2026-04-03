const API_BASE_URL = 'http://localhost:8000/api' // 假设你的 Python FastAPI 运行在本地 8000 端口

/**
 * 请求 AI 财务诊断建议
 * @param {Object} promptData - 从 financeStore 中获取的 aiPromptData
 * @returns {Promise<string>} - 大模型生成的 Markdown 文本
 */
export async function fetchAiDiagnosis(promptData) {
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
    const data = await response.json()
    
    // 4. 提取后端返回的分析文本 (假设后端返回结构为 { success: true, result: "markdown文本..." })
    // 具体字段名 (result/data/content) 根据你 FastAPI 的返回结构调整
    return data.result || data.data || data.content || "🤖 未能解析大模型的回复，请检查后端返回格式。"

  } catch (error) {
    console.error("AI 分析接口调用失败:", error)
    throw error
  }
}