// background.js
let isRecording = false;
let recordedActions = [];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tabId === tab.id) {
        const isValid = testURL(tab.url);
        if (isRecording && !isValid) {
            chrome.action.setBadgeText({ text: "WAIT" });
            chrome.action.setBadgeBackgroundColor({ color: "#FFA500" });
        } else if (isRecording && isValid) {
            chrome.action.setBadgeText({ text: "REC" });
            chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "startRecording") {
        isRecording = true;
        startRecording();
        sendResponse({ status: "Recording started"});
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "startRecording" });
        });
    } else if (message.action === "stopRecording") {
        isRecording = false;
        updateBadge("", "#000000");
        sendResponse({ status: "Recording stopped" });
    } else if (message.action === "getRecordingStatus") {
        sendResponse({ isRecording });
    } else if (message.action === "addRecordedAction") {
        recordedActions.push(message.data);
    } else if (message.action === "getRawData") {
        sendResponse({ data: recordedActions });
    }
});

async function startRecording() {
    isRecording = true;
    recordedActions = [];
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (testURL(tab.url)) {
            updateBadge("REC", "#FF0000");
        } else {
            updateBadge("WAIT", "#FFA500");
        }
    });
}

function getActiveTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            resolve(tabs[0]);
        });
    });
}

function testURL(url) {
    return /^https?:\/\//.test(url);
}

function updateBadge(text, color) {
    chrome.action.setBadgeText({ text: text });
    chrome.action.setBadgeBackgroundColor({ color: color });
}