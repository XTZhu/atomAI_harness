import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '~': '/Users/zhuwenzhe/Developer/tools/atomAI_harness/app',
    },
  },
})
