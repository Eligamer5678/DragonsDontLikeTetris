export default function createHDiv(pos, size, bg, cssProps = {}, parent) {
    const uiCanvas = document.getElementById('UI');
    if (!uiCanvas) throw new Error('UI canvas not found');
    const div = document.createElement('div');
    function updateDivPosition() {
        const rect = uiCanvas.getBoundingClientRect();
        const scaleX = rect.width / 1920;
        const scaleY = rect.height / 1080;
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
    window.addEventListener('resize', updateDivPosition);
    updateDivPosition();
    if (!parent) parent = uiCanvas.parentNode;
    parent.appendChild(div);
    return div;
}
