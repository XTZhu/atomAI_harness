<template>
  <div>
    <NuxtLoadingIndicator color="#6366f1" :height="3" :duration="3000" :throttle="200" />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
/* 全局: el-tag 文字过长截断 */
.el-tag__content {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  vertical-align: middle;
}

/* 确保 el-space 内的 tag 不会撑破布局 */
.el-space .el-tag {
  max-width: 320px;
}

.el-space .el-tag .el-tag__content {
  max-width: 100%;
}
</style>
