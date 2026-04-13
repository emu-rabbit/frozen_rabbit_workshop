/**
 * Filters out FFXIV special symbols (PUA area: \uE000-\uF8FF), 
 * control characters, and invisible whitespace markers.
 */
export const cleanFfivName = (text: string): string => {
  return text
    .replace(/[\uE000-\uF8FF\r\n\t\v\f\u200B-\u200D\uFEFF]/g, '')
    .trim();
};

/**
 * Live cleaning version: Filters symbols but DOES NOT trim.
 * Useful for real-time input filtering without disrupting space entry or cursor position.
 */
export const cleanFfivNameLive = (text: string): string => {
  return text.replace(/[\uE000-\uF8FF\r\n\t\v\f\u200B-\u200D\uFEFF]/g, '');
};

/**
 * Vue 3 Directive to cleanly filter FFXIV special characters.
 * Implements high-reliability event capturing with minimized side effects.
 */
export const vFfivClean = {
  mounted(el: HTMLElement) {
    const input = el.tagName === 'INPUT' ? (el as HTMLInputElement) : el.querySelector('input');
    if (!input) return;

    let isComposing = false;
    input.addEventListener('compositionstart', () => { isComposing = true; });
    input.addEventListener('compositionend', () => { 
        isComposing = false;
        // Trigger cleaning check after composition ends
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const cleanAndSync = (e: Event) => {
      if (isComposing) return;
      
      const target = e.target as HTMLInputElement;
      const original = target.value;
      // We use the "Live" version here to avoid aggressive trimming while typing
      const cleaned = cleanFfivNameLive(original);
      
      if (original !== cleaned) {
        const start = target.selectionStart || 0;
        target.value = cleaned;
        
        // Restore cursor position
        const diff = original.length - cleaned.length;
        const newPos = Math.max(0, start - diff);
        target.setSelectionRange(newPos, newPos);
        
        // Notify Vue/PrimeVue of the change
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    // Use capture phase to intercept before component internal handlers
    input.addEventListener('input', cleanAndSync, true);

    input.onpaste = (e: ClipboardEvent) => {
        e.stopPropagation();
        e.preventDefault();
        
        const text = e.clipboardData?.getData('text') || '';
        // Paste should be fully cleaned (including trim)
        const cleaned = cleanFfivName(text);
        
        // Try to use insertText to preserve Undo/Redo stack
        // Attempting to focus ensures the command targets the right element
        input.focus();
        try {
            if (!document.execCommand('insertText', false, cleaned)) {
                throw new Error('execCommand failed');
            }
        } catch (err) {
            // Fallback for browsers that don't support insertText
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const val = input.value;
            input.value = val.substring(0, start) + cleaned + val.substring(end);
            input.setSelectionRange(start + cleaned.length, start + cleaned.length);
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    };
  }
};
