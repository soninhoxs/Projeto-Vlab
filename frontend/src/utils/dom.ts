export function isEventOnThemeToggle(event: Event): boolean {
  const target = event.target;
  return target instanceof Element && Boolean(target.closest('#theme-toggle, .theme-toggle'));
}
