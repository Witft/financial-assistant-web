<template>
  <div class="transaction-list">
    <div
      v-for="t in transactions"
      :key="t.id"
      class="transaction-item"
      :class="{ income: t.amount > 0, expense: t.amount < 0 }"
    >
      <span class="t-date">{{ t.date }}</span>
      <span class="t-desc">{{ t.description }}</span>
      <span class="t-amount">{{ t.amount > 0 ? '+' : '' }}¥{{ t.amount }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  transactions: {
    type: Array,
    required: true
  }
})
</script>

<style scoped>
.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.transaction-item {
  display: grid;
  grid-template-columns: 100px 1fr auto;
  gap: 1rem;
  padding: 0.75rem;
  background: #fafafa;
  border-radius: 8px;
  align-items: center;
}

.transaction-item.income .t-amount { color: #52c41a; }
.transaction-item.expense .t-amount { color: #ff4d4f; }

.t-date { color: #999; font-size: 0.9rem; }
.t-desc { color: #333; }
.t-amount { font-weight: bold; }
</style>