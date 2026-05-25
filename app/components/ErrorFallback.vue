<template>
  <div class="error-fallback">
    <el-result icon="warning" :title="title" :sub-title="message">
      <template #extra>
        <el-button type="primary" @click="$emit('retry')">
          <el-icon><Refresh /></el-icon> 重试
        </el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'

defineProps<{
  title?: string
  message: string
}>()

defineEmits<{
  retry: []
}>()
</script>

<style scoped>
.error-fallback {
  padding: 24px;
}
</style>
