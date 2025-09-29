export let getID = document.getElementById.bind(document);

export function addEvent(target, item, event, func) {
    if (target === "item" && item instanceof HTMLElement) {
        item.addEventListener(event, func);
    } else if (target === "window") {
        window.addEventListener(event, func);
    } else if (typeof item === "string") {
        const el = document.getElementById(item);
        if (el) el.addEventListener(event, func);
        else console.warn(`Element with id "${item}" not found.`);
    } else {
        console.warn("Invalid target/item provided to addEvent.");
    }
}

export function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
    .then(() => {
        console.log('Copied to clipboard:', text);
    })
    .catch(err => {
        console.error('Failed to copy: ', err);
    });
}
