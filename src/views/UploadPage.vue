<template>
  <div class="upload-page">
    <div class="container">
      <h1 class="title">💰 财务助手</h1>
      <p class="subtitle">上传你的支付宝/微信账单，我来帮你分析</p>

      <div
        class="drop-zone"
        :class="{ 'drag-over': isDragOver }"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".csv,.txt,.xlsx,.xls"
          @change="handleFileSelect"
          style="display: none"
        />

        <div class="drop-zone-content">
          <span class="icon">📁</span>
          <p class="text">拖拽 CSV/Excel 文件到这里</p>
          <p class="sub-text">或点击选择文件</p>
        </div>
      </div>

      <div class="supported-files">
        <p>支持：支付宝 CSV / 微信 Excel(.xlsx)</p>
      </div>

      <div v-if="hasExistingData" class="existing-data">
        <p>已有数据，是否查看 Dashboard？</p>
        <button @click="goToDashboard" class="btn-secondary">
          查看 Dashboard →
        </button>
      </div>

      <!-- 解析状态提示 -->
      <div v-if="status" class="status" :class="status.type">
        {{ status.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { parseTransactions } from '@/utils/parsers'
import { saveTransactions, getTransactions } from '@/utils/storage'
import { useFinanceStore } from '@/stores/finance'

const router = useRouter()
const fileInput = ref(null)
const isDragOver = ref(false)
const status = ref(null)
const hasExistingData = ref(false)

// 检查是否有已有数据
onMounted(() => {
  const data = getTransactions()
  hasExistingData.value = data && data.length > 0
})

// 拖拽相关处理
function handleDragOver() {
  isDragOver.value = true
}

function handleDragLeave() {
  isDragOver.value = false
}

function handleDrop(event) {
  isDragOver.value = false
  const files = event.dataTransfer.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

// 点击触发文件选择
function triggerFileInput() {
  fileInput.value.click()
}

function handleFileSelect(event) {
  const files = event.target.files
  if (files.length > 0) {
    processFile(files[0])
  }
}

// 处理文件
async function processFile(file) {
  status.value = { type: 'loading', message: '正在解析文件...' }

  try {
    let transactions

    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Excel 文件
      transactions = await parseExcelFile(file)
    } else {
      // CSV 文件
      const text = await readFileAsText(file)
      transactions = parseTransactions(text, file.name)
    }

    saveTransactions(transactions)
    
    // 触发 AI 分类增强（三层分类：关键词 + 缓存 + AI）
    const financeStore = useFinanceStore()
    financeStore.enhanceCategories().then((calledAi) => {
      if (calledAi) {
        status.value = { type: 'success', message: `成功解析 ${transactions.length} 条记录，正在智能分类...` }
      } else {
        status.value = { type: 'success', message: `成功解析 ${transactions.length} 条记录！` }
      }
      
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    })
  } catch (error) {
    console.error('解析错误:', error)
    status.value = { type: 'error', message: error.message }
  }
}

// 解析 Excel 文件
async function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        // 获取第一个工作表
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // 转换为 JSON 数组（包含表头）
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

        if (jsonData.length < 2) {
          reject(new Error('文件内容为空或格式不正确'))
          return
        }

        // 转换为 CSV 格式字符串，交给 parseTransactions 处理
        const csvText = XLSX.utils.sheet_to_csv(worksheet)
        const transactions = parseTransactions(csvText, file.name)

        resolve(transactions)
      } catch (err) {
        reject(new Error('Excel 文件解析失败: ' + err.message))
      }
    }

    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

// 读取文件内容（自动检测编码）
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const buffer = e.target.result

      // 尝试用 UTF-8 解码，失败则用 GBK
      try {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
        console.log('UTF-8 解码成功')
        resolve(text)
      } catch {
        console.log('UTF-8 解码失败，使用 GBK 解码')
        const text = new TextDecoder('gbk').decode(buffer)
        resolve(text)
      }
    }

    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

function goToDashboard() {
  router.push('/dashboard')
}
</script>

<style scoped>
.upload-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 500px;
  width: 100%;
  text-align: center;
}

.title {
  color: white;
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2rem;
}

.drop-zone {
  background: white;
  border: 3px dashed #ddd;
  border-radius: 16px;
  padding: 3rem 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.drop-zone:hover,
.drop-zone.drag-over {
  border-color: #667eea;
  background: #f8f9ff;
  transform: scale(1.02);
}

.drop-zone-content .icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.drop-zone-content .text {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.drop-zone-content .sub-text {
  color: #999;
  font-size: 0.9rem;
}

.supported-files {
  margin-top: 1.5rem;
  color: rgba(255, 255, 255, 0.7);
}

.existing-data {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
}

.existing-data p {
  margin-bottom: 1rem;
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s;
}

.btn-secondary:hover {
  transform: scale(1.05);
}

.status {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
  font-weight: 500;
}

.status.loading {
  background: #fff3cd;
  color: #856404;
}

.status.success {
  background: #d4edda;
  color: #155724;
}

.status.error {
  background: #f8d7da;
  color: #721c24;
}
</style>
