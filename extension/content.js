// content.js
onPageLoad();
// alert('Content script loaded');

function onPageLoad() {
    chrome.runtime.sendMessage({ action: "getRecordingStatus" }, (response) => {
        if (response.isRecording) {
            recordPageVisit();
            addListeners();
        }
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startRecording") {
        // alert('content script will update!'); // THIS IS NOT RUNNING
        recordPageVisit();
        addListeners();
    }
});

function recordPageVisit() {
    chrome.runtime.sendMessage({
        action: "addRecordedAction",
        data: {
            type: 'pageVisit',
            url: window.location.href,
            timestamp: Date.now(),
        },
    });
}

function addListeners() {
    // Listen for various types of events to capture typing and input changes
    document.addEventListener("click", captureAction);
    document.addEventListener("input", debounce(captureAction, 300)); // debounce to reduce # of input packets
    document.addEventListener("scroll", captureAction);
}

function captureAction(event) {
    chrome.runtime.sendMessage({ action: "getRecordingStatus" }, (response) => {
        if (!response.isRecording) return;

        let action = {
            type: event.type,
            selector: getXPath(event.target),
            timestamp: Date.now(),
        };

        // Handle 'input' event - capture value for input elements
        if (event.type === "input") {
            if (event.target.tagName === 'DIV' && event.target.isContentEditable) {
                action.value = event.target.innerText;  // or innerHTML for editable divs
            } else if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') {
                action.value = event.target.value;  // for standard input elements (text, password, etc.)
            }
        }

        if (event.type === "scroll") {
            action.x = window.scrollX;
            action.y = window.scrollY;
        }

        chrome.runtime.sendMessage({ action: "addRecordedAction", data: action });
    });
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

function getXPath(element) {
    if (!element) return null;
    if (element.id) return `//*[@id="${element.id}"]`;
    if (element === document.body) return element.tagName.toLowerCase();

    const siblingIndex = Array.from(element.parentNode.children).filter(e => e.tagName === element.tagName).indexOf(element) + 1;
    const tagName = element.tagName.toLowerCase();
    const parentXPath = getXPath(element.parentNode);

    const indexSegment = siblingIndex > 1 ? `[${siblingIndex}]` : '';
    return `${parentXPath}/${tagName}${indexSegment}`;
}