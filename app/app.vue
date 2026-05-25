<template>
  <div>
    <NuxtLoadingIndicator color="#6366f1" :height="3" :duration="3000" :throttle="200" />
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
