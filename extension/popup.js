// popup.js
checkIfRecording();
loadPreviousData();

document.getElementById("toggleRecording").addEventListener("click", () => {
    isRecording = chrome.runtime.sendMessage({ action: "getRecordingStatus" }, (response) => {
        if (response.isRecording) { // stopping recording
            document.getElementById("toggleRecording").innerText = "Start Recording";
            chrome.runtime.sendMessage({ action: "stopRecording" }, (response) => {
                console.log(response.status);
            });
            chrome.runtime.sendMessage({ action: "getRawData" }, (response) => {
                document.getElementById('jsonData').innerText = JSON.stringify(response.data, null, 2);
            });
        } else {
            document.getElementById("toggleRecording").innerText = "Stop Recording";
            chrome.runtime.sendMessage({ action: "startRecording" }, (response) => {
                console.log(response.status);
            });
        }
        return response.isRecording;
    });
});

document.getElementById("download").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "getRawData" }, (response) => {
        let blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = "action_trace.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
});

document.getElementById("runRecording").addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "getRawData" }, (response) => {
        runRecording(response.data);
    });
});

function loadPreviousData() {
    chrome.runtime.sendMessage({ action: "getRawData" }, (response) => {
        document.getElementById('jsonData').innerText = JSON.stringify(response.data, null, 2);
    });
}

function checkIfRecording() {
    chrome.runtime.sendMessage({ action: "getRecordingStatus" }, (response) => {
        if (response.isRecording) {
            document.getElementById("toggleRecording").innerText = "Stop Recording";
        } else {
            document.getElementById("toggleRecording").innerText = "Start Recording";
        }
    });
}

function runRecording(actions) {
    chrome.windows.create({ url: actions[0].url, type: 'popup' }, (newWindow) => {
        first_time_stamp = actions[0].timestamp;
        const newTabId = newWindow.tabs[0].id;
        actions.forEach((action, index) => {
            if (index === 0) return;
            setTimeout(() => {
                chrome.tabs.sendMessage(newTabId, { action: "executeAction", data: action });
            }, action.timestamp - first_time_stamp); // same delay as original recording
        });
    });
}