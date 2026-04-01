<template>
  <div class="filter-row">
    <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
      <option value="">全部月份</option>
      <option v-for="month in monthOptions" :key="month" :value="month">
        {{ month }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { computed } from 'vue'

defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

defineEmits(['update:modelValue'])

// 动态生成月份选项（过去12个月）
const monthOptions = computed(() => {
  const months = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push(month)
  }
  return months
})
</script>

<style scoped>
.filter-row {
  margin-bottom: 1rem;
}

.filter-row select {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #333;
  background: white;
  cursor: pointer;
}
</style>