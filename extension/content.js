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
    } else if (request.action === "executeAction") {
        executeAction(request.data);
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
    if (element === document.body) return '/html/body';

    let path = '';
    while (element && element.nodeType === Node.ELEMENT_NODE) {
        let index = 0;
        let sibling = element.previousSibling;
        while (sibling) {
            if (sibling.nodeType === Node.DOCUMENT_TYPE_NODE) {
                sibling = sibling.previousSibling;
                continue;
            }
            if (sibling.nodeName === element.nodeName) {
                index++;
            }
            sibling = sibling.previousSibling;
        }
        const tagName = element.nodeName.toLowerCase();
        const position = index ? `[${index + 1}]` : '';
        path = `/${tagName}${position}${path}`;
        element = element.parentNode;
    }
    return path;
}

function executeAction(action) {
    if (action.type === 'click') {
        const element = document.evaluate(action.selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        alert(element);
        if (element) {
            element.click();
        }
    } else if (action.type === 'input') {
        const element = document.evaluate(action.selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (element) {
            element.value = action.value;
            element.innerText = action.value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } else if (action.type === 'scroll') {
        window.scrollTo(action.x, action.y);
    } else if (action.type === 'pageVisit') {
        window.location.href = action.url
    }
}