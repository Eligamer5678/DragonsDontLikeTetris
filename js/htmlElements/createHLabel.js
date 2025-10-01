export default function createHLabel(pos, size, text, cssProps = {}, parent) {
    const uiCanvas = document.getElementById('UI');
    if (!uiCanvas) throw new Error('UI canvas not found');
    const label = document.createElement('label');
    label.textContent = text;
    function updateLabelPosition() {
        const rect = uiCanvas.getBoundingClientRect();
        const scaleX = rect.width / 1920;
        const scaleY = rect.height / 1080;
        const left = rect.left + pos.x * scaleX;
        const top = rect.top + pos.y * scaleY;
        const width = size.x * scaleX;
        const height = size.y * scaleY;
        label.style.position = 'absolute';
        label.style.left = left + 'px';
        label.style.top = top + 'px';
        label.style.width = width + 'px';
        label.style.height = height + 'px';
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.justifyContent = 'center';
        label.style.zIndex = 1000;
        let baseFontSize = 16;
        if (cssProps.fontSize) {
            if (typeof cssProps.fontSize === 'number') baseFontSize = cssProps.fontSize;
            else if (typeof cssProps.fontSize === 'string' && cssProps.fontSize.endsWith('px')) baseFontSize = parseFloat(cssProps.fontSize);
        }
        label.style.fontSize = (baseFontSize * scaleY) + 'px';
        for (const key in cssProps) {
            if (key !== 'fontSize') label.style[key] = cssProps[key];
        }
    }
    window.addEventListener('resize', updateLabelPosition);
    updateLabelPosition();
    if (!parent) parent = uiCanvas.parentNode;
    parent.appendChild(label);
    return label;
}
