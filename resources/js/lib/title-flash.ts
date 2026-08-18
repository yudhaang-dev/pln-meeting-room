const ALERT_PREFIX = '(!) ';

const FLASH_INTERVAL_MS = 1000;

let flashText: string | null = null;
let baseTitle = '';
let timer: ReturnType<typeof setInterval> | null = null;
let alertOn = false;
let registered = false;

function isTabInactive(): boolean {
    return document.hidden || !document.hasFocus();
}

function applyFlash() {
    alertOn = !alertOn;

    if (alertOn) {
        document.title = `${ALERT_PREFIX}${flashText}`;

        return;
    }

    const currentTitle = document.title;

    if (currentTitle && !currentTitle.startsWith(ALERT_PREFIX)) {
        baseTitle = currentTitle;
    }

    document.title = baseTitle;
}

export function flashTitle(text: string) {
    if (typeof document === 'undefined' || !isTabInactive()) {
        return;
    }

    if (timer) {
        flashText = text;

        return;
    }

    baseTitle = document.title;
    flashText = text;
    alertOn = false;
    applyFlash();
    timer = setInterval(applyFlash, FLASH_INTERVAL_MS);
}

export function clearTitleFlash() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }

    if (flashText !== null) {
        flashText = null;
        alertOn = false;

        if (document.title.startsWith(ALERT_PREFIX)) {
            document.title = baseTitle;
        }
    }
}

export function setupTitleFlash() {
    if (registered || typeof document === 'undefined') {
        return;
    }

    registered = true;

    const clear = () => {
        if (!document.hidden && document.hasFocus()) {
            clearTitleFlash();
        }
    };

    document.addEventListener('visibilitychange', clear);
    window.addEventListener('focus', clear);
}
