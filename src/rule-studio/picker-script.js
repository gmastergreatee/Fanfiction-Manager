// Version 4/src/rule-studio/picker-script.js
/**
 * Visual Element Picker Engine
 * Injected into WebView / iframe across Windows, Linux, macOS, Android, and iOS.
 * Enables visual tap/click element selection to generate robust CSS selectors with zero coding.
 */

(function () {
  if (window.__fanfictionPickerInjected) return;
  window.__fanfictionPickerInjected = true;

  const STEPS = [
    { key: 'title', label: 'Tap or Click the Novel Title' },
    { key: 'cover', label: 'Tap or Click the Cover Image' },
    { key: 'chapters', label: 'Tap or Click any Chapter Link' },
    { key: 'content', label: 'Open a chapter and tap Story Text' },
  ];

  let currentStepIndex = 0;
  let collectedSelectors = {};
  let highlightedElement = null;

  // 1. Create Floating HUD Overlay
  const hud = document.createElement('div');
  hud.id = '__ff_picker_hud';
  hud.innerHTML = `
    <div style="position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 2147483647; background: #1e1e1e; color: #fff; padding: 10px 18px; border-radius: 30px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); border: 1px solid #3b82f6; font-family: sans-serif; display: flex; align-items: center; gap: 12px; font-size: 13px;">
      <span style="background: #3b82f6; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px;" id="__ff_step_badge">1</span>
      <span id="__ff_step_label" style="font-weight: 500;">Tap or Click the Novel Title</span>
      <button id="__ff_skip_btn" style="background: #333; color: #aaa; border: none; padding: 4px 10px; border-radius: 12px; cursor: pointer; font-size: 11px;">Skip</button>
      <button id="__ff_close_btn" style="background: #dc2626; color: #fff; border: none; padding: 4px 10px; border-radius: 12px; cursor: pointer; font-size: 11px;">Cancel</button>
    </div>
  `;
  document.body.appendChild(hud);

  // 2. Highlighting Overlay Box
  const box = document.createElement('div');
  box.id = '__ff_picker_box';
  box.style.position = 'fixed';
  box.style.pointerEvents = 'none';
  box.style.zIndex = '2147483646';
  box.style.border = '2px solid #3b82f6';
  box.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
  box.style.transition = 'all 0.08s ease-out';
  box.style.display = 'none';
  document.body.appendChild(box);

  // Calculate clean CSS selector for element
  function generateSelector(el) {
    if (!el || el === document.body || el === document.documentElement) return '';
    if (el.id && !el.id.match(/\d{4,}/)) {
      return '#' + CSS.escape(el.id);
    }
    const tag = el.tagName.toLowerCase();
    const validClasses = Array.from(el.classList).filter(
      (c) => !c.startsWith('__ff') && !c.match(/active|hover|focus|show|hide/i)
    );
    if (validClasses.length > 0) {
      return `${tag}.${validClasses.map((c) => CSS.escape(c)).join('.')}`;
    }
    if (el.parentElement && el.parentElement !== document.body) {
      const parentSel = generateSelector(el.parentElement);
      return parentSel ? `${parentSel} > ${tag}` : tag;
    }
    return tag;
  }

  function updateHighlight(target) {
    if (!target || target.closest('#__ff_picker_hud')) {
      box.style.display = 'none';
      return;
    }
    highlightedElement = target;
    const rect = target.getBoundingClientRect();
    box.style.display = 'block';
    box.style.top = rect.top + 'px';
    box.style.left = rect.left + 'px';
    box.style.width = rect.width + 'px';
    box.style.height = rect.height + 'px';
  }

  // Pointer / Touch tracking
  document.addEventListener('pointermove', (e) => {
    updateHighlight(e.target);
  });

  document.addEventListener('touchstart', (e) => {
    if (e.touches[0]) updateHighlight(e.touches[0].target);
  }, { passive: true });

  // Handle selection on click/tap
  document.addEventListener('click', (e) => {
    if (e.target.closest('#__ff_picker_hud')) return;
    e.preventDefault();
    e.stopPropagation();

    const target = highlightedElement || e.target;
    const selector = generateSelector(target);
    const step = STEPS[currentStepIndex];

    let extractedValue = '';
    let matchesCount = 1;

    if (step.key === 'cover') {
      extractedValue = target.src || target.getAttribute('data-src') || '';
    } else if (step.key === 'chapters') {
      const links = document.querySelectorAll(selector);
      matchesCount = links.length;
      extractedValue = `${matchesCount} chapter links detected`;
      // Flash all matching links in green
      links.forEach((l) => (l.style.outline = '2px dashed #10b981'));
    } else {
      extractedValue = target.innerText.trim().slice(0, 80);
    }

    collectedSelectors[step.key] = selector;

    // Send result to host application
    notifyHost({
      event: 'element_selected',
      step: step.key,
      selector,
      extractedValue,
      matchesCount,
      allCollected: collectedSelectors,
    });

    // Advance step
    currentStepIndex++;
    if (currentStepIndex < STEPS.length) {
      document.getElementById('__ff_step_badge').innerText = currentStepIndex + 1;
      document.getElementById('__ff_step_label').innerText = STEPS[currentStepIndex].label;
    } else {
      document.getElementById('__ff_step_label').innerText = '✅ All Elements Selected!';
      notifyHost({ event: 'picker_complete', rules: collectedSelectors });
      setTimeout(cleanup, 1200);
    }
  }, true);

  document.getElementById('__ff_skip_btn').onclick = () => {
    currentStepIndex++;
    if (currentStepIndex < STEPS.length) {
      document.getElementById('__ff_step_badge').innerText = currentStepIndex + 1;
      document.getElementById('__ff_step_label').innerText = STEPS[currentStepIndex].label;
    }
  };

  document.getElementById('__ff_close_btn').onclick = cleanup;

  function cleanup() {
    if (hud) hud.remove();
    if (box) box.remove();
    window.__fanfictionPickerInjected = false;
    notifyHost({ event: 'picker_cancelled' });
  }

  function notifyHost(data) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(data));
    } else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.picker) {
      window.webkit.messageHandlers.picker.postMessage(JSON.stringify(data));
    } else if (window.electronAPI && window.electronAPI.pickerCallback) {
      window.electronAPI.pickerCallback(data);
    } else {
      window.parent.postMessage({ type: 'FF_PICKER', data }, '*');
    }
  }
})();

