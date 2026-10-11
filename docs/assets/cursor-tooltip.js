/**
 * Cursor-following tooltip for Plotly charts, shared across pages.
 */
(function () {
  function isDesktop() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  // Pull the Nth entry out of an array-valued style prop, or return it as-is if scalar.
  function pick(val, idx) {
    if (Array.isArray(val)) return val[idx] !== undefined ? val[idx] : val[0];
    return val;
  }

  function enhance(el) {
    if (el.dataset.cursorTooltip) return; // already wired up
    el.dataset.cursorTooltip = 'true';

    var hasBar = (el.data || []).some(function (trace) { return trace.type === 'bar'; });
    var layoutUpdate = hasBar ? { hovermode: 'closest' } : {};

    // hoverinfo 'none' hides Plotly's own label
    Plotly.update(el, { hoverinfo: 'none' }, layoutUpdate);

    var tooltip = document.createElement('div');
    tooltip.style.position = 'fixed';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.fontFamily = 'Inter, sans-serif';
    tooltip.style.fontSize = '13px';
    tooltip.style.lineHeight = '1.4';
    tooltip.style.padding = '6px 10px';
    tooltip.style.borderRadius = '4px';
    tooltip.style.border = '1px solid transparent';
    tooltip.style.zIndex = '9999';
    tooltip.style.display = 'none';
    tooltip.style.whiteSpace = 'nowrap';
    document.body.appendChild(tooltip);

    var mouseX = 0, mouseY = 0;
    var hideTimer = null;

    // Sit 16px below-right of the cursor; flip to the other side near the window edge.
    function place() {
      var gap = 16, margin = 8;
      var w = tooltip.offsetWidth, h = tooltip.offsetHeight;
      var left = mouseX + gap, top = mouseY + gap;
      if (left + w > window.innerWidth - margin) left = mouseX - w - gap;
      if (top + h > window.innerHeight - margin) top = mouseY - h - gap;
      tooltip.style.left = Math.max(margin, left) + 'px';
      tooltip.style.top = Math.max(margin, top) + 'px';
    }

    el.on('plotly_hover', function (data) {
      // Cancel a pending hide from the previous point - on densely packed
      // bars/points, the "closest" point can flip between neighbors on tiny
      // mouse movements, firing unhover then hover again within a few ms.
      // Without this, that shows up as the tooltip visibly blinking.
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }

      var pt = data.points[0];
      var idx = pt.pointNumber || 0;
      var fd = pt.fullData || pt.data;

      var arr = (fd && fd.hovertext) || pt.data.hovertext;
      var text = Array.isArray(arr) ? arr[idx] : arr;
      if (!text) return;

      var hl = (fd && fd.hoverlabel) || {};
      var bg = pick(hl.bgcolor, idx) || '#333333';
      var border = pick(hl.bordercolor, idx) || bg;
      var fontColor = (hl.font && pick(hl.font.color, idx)) || '#ffffff';

      tooltip.style.background = bg;
      tooltip.style.borderColor = border;
      tooltip.style.color = fontColor;
      tooltip.innerHTML = text;
      tooltip.style.display = 'block';
      place();
    });

    el.on('plotly_unhover', function () {
      // Delay the hide slightly instead of hiding immediately, so a same-frame
      // re-hover on the next bar/point (see above) cancels it before it's seen.
      hideTimer = setTimeout(function () {
        tooltip.style.display = 'none';
        hideTimer = null;
      }, 40);
    });

    el.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (tooltip.style.display === 'block') place();
    });
  }

  function enhanceAll() {
    if (!isDesktop()) return;
    document.querySelectorAll('.js-plotly-plot').forEach(enhance);
  }

  if (document.readyState === 'complete') {
    enhanceAll();
  } else {
    window.addEventListener('load', enhanceAll);
  }
})();
