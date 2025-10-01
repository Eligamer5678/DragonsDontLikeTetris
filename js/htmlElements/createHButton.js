export default function createHButton(pos, size, bg, cssProps = {}, parent) {
    const uiCanvas = document.getElementById('UI');
    if (!uiCanvas) throw new Error('UI canvas not found');
    const btn = document.createElement('button');
    function updateBtnPosition() {
        const rect = uiCanvas.getBoundingClientRect();
        const scaleX = rect.width / 1920;
        const scaleY = rect.height / 1080;
        const left = rect.left + pos.x * scaleX;
        const top = rect.top + pos.y * scaleY;
        const width = size.x * scaleX;
        const height = size.y * scaleY;
        btn.style.position = 'absolute';
        btn.style.left = left + 'px';
        btn.style.top = top + 'px';
        btn.style.width = width + 'px';
        btn.style.height = height + 'px';
        btn.style.background = bg;
        btn.style.border = 'none';
        btn.style.cursor = 'pointer';
        btn.style.fontFamily = 'inherit';
        btn.style.zIndex = 1000;
        // Scale font size (default 16px)
        let baseFontSize = 16;
        if (cssProps.fontSize) {
            if (typeof cssProps.fontSize === 'number') baseFontSize = cssProps.fontSize;
            else if (typeof cssProps.fontSize === 'string' && cssProps.fontSize.endsWith('px')) baseFontSize = parseFloat(cssProps.fontSize);
        }
        btn.style.fontSize = (baseFontSize * scaleY) + 'px';
        for (const key in cssProps) {
            if (key !== 'fontSize') btn.style[key] = cssProps[key];
        }
    }
    window.addEventListener('resize', updateBtnPosition);
    updateBtnPosition();
    if (!parent) parent = uiCanvas.parentNode;
    parent.appendChild(btn);
    return btn;
}
