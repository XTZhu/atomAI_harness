/**
 * 移动端检测 Composable
 *
 * @example
 * const { isMobile } = useMobileDetect()
 */
export function useMobileDetect(breakpoint = 768) {
  const isMobile = ref(false)

  const check = () => {
    isMobile.value = window.innerWidth < breakpoint
  }

  onMounted(() => {
    check()
    window.addEventListener('resize', check)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', check)
  })

  return { isMobile }
}
