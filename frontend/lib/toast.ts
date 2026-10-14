let el: HTMLDivElement | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

export function toast(message: string): void {
  if (typeof document === 'undefined') return;
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  // force reflow so the transition replays
  void el.offsetWidth;
  el.classList.add('show');
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => el?.classList.remove('show'), 2600);
}
