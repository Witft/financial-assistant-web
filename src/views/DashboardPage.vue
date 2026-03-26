<template>
  <div class="dashboard">
    <div class="container">
      <h1>Dashboard</h1>
      <p>这里将展示财务数据可视化</p>
      
      <div class="nav">
        <router-link to="/" class="btn">← 返回上传</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  padding: 2rem;
  background: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  margin-top: 1rem;
}
</style>