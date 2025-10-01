export default function createHInput(pos, size, type = 'text', cssProps = {}, parent) {
    const uiCanvas = document.getElementById('UI');
    if (!uiCanvas) throw new Error('UI canvas not found');
    const input = document.createElement('input');
    input.type = type;
    function updateInputPosition() {
        const rect = uiCanvas.getBoundingClientRect();
        const scaleX = rect.width / 1920;
        const scaleY = rect.height / 1080;
        const left = rect.left + pos.x * scaleX;
        const top = rect.top + pos.y * scaleY;
        const width = size.x * scaleX;
        const height = size.y * scaleY;
        input.style.position = 'absolute';
        input.style.left = left + 'px';
        input.style.top = top + 'px';
        input.style.width = width + 'px';
        input.style.height = height + 'px';
        input.style.zIndex = 1000;
        // Scale font size (default 16px)
        let baseFontSize = 16;
        if (cssProps.fontSize) {
            if (typeof cssProps.fontSize === 'number') baseFontSize = cssProps.fontSize;
            else if (typeof cssProps.fontSize === 'string' && cssProps.fontSize.endsWith('px')) baseFontSize = parseFloat(cssProps.fontSize);
        }
        input.style.fontSize = (baseFontSize * scaleY) + 'px';
        for (const key in cssProps) {
            if (key !== 'fontSize') input.style[key] = cssProps[key];
        }
    }
    window.addEventListener('resize', updateInputPosition);
    updateInputPosition();
    if (!parent) parent = uiCanvas.parentNode;
    parent.appendChild(input);
    return input;
}
