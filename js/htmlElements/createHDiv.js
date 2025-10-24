export default function createHDiv(pos, size, bg, cssProps = {}, parent) {
    const uiCanvas = document.getElementById('UI');
    if (!uiCanvas) throw new Error('UI canvas not found');
    const div = document.createElement('div');

    // internal helper to compute scale relative to the UI canvas
    function getScale() {
        const rect = uiCanvas.getBoundingClientRect();
        return { rect, scaleX: rect.width / 1920, scaleY: rect.height / 1080 };
    }

    function updateDivPosition() {
        const { rect, scaleX, scaleY } = getScale();
        const left = rect.left + pos.x * scaleX;
        const top = rect.top + pos.y * scaleY;
        const width = size.x * scaleX;
        const height = size.y * scaleY;
        div.style.position = 'absolute';
        div.style.left = left + 'px';
        div.style.top = top + 'px';
        div.style.width = width + 'px';
        div.style.height = height + 'px';
        div.style.background = bg;
        div.style.zIndex = 1000;
        // Scale font size (default 16px)
        let baseFontSize = 16;
        if (cssProps.fontSize) {
            if (typeof cssProps.fontSize === 'number') baseFontSize = cssProps.fontSize;
            else if (typeof cssProps.fontSize === 'string' && cssProps.fontSize.endsWith('px')) baseFontSize = parseFloat(cssProps.fontSize);
        }
        div.style.fontSize = (baseFontSize * scaleY) + 'px';
        for (const key in cssProps) {
            if (key !== 'fontSize') div.style[key] = cssProps[key];
        }
    }

    // Make the div draggable. Drag updates the logical `pos` so resize keeps the new placement.
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;

    function onPointerDown(e) {
        // Prevent dragging when interacting with obvious interactive elements
        const interactive = e.target.closest && e.target.closest('input, button, textarea, select, [contenteditable="true"]');
        if (interactive) return;
        // Left button or touch only
        if (e.button !== undefined && e.button !== 0) return;
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        origLeft = parseFloat(div.style.left) || 0;
        origTop = parseFloat(div.style.top) || 0;
        div.style.transition = 'none';
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        e.preventDefault();
    }

    function onPointerMove(e) {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        div.style.left = (origLeft + dx) + 'px';
        div.style.top = (origTop + dy) + 'px';
    }

    function onPointerUp(e) {
        if (!dragging) return;
        dragging = false;
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        // Recompute logical pos based on final pixel position so future resize keeps it
        const { rect, scaleX, scaleY } = getScale();
        const finalLeft = parseFloat(div.style.left) || 0;
        const finalTop = parseFloat(div.style.top) || 0;
        // convert back to logical coordinates (1920x1080 space)
        pos.x = (finalLeft - rect.left) / scaleX;
        pos.y = (finalTop - rect.top) / scaleY;
        // restore styled position according to logical pos & scale
        updateDivPosition();
    }

    div.addEventListener('pointerdown', onPointerDown);

    window.addEventListener('resize', updateDivPosition);
    updateDivPosition();

    if (!parent) parent = uiCanvas.parentNode;
    parent.appendChild(div);
    return div;
}
