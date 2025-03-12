# Altera Chrome Extension Interview

## Problem
You will be implementing a version of the [Chrome DevTools Recorder](https://developer.chrome.com/docs/devtools/recorder). This is a tool that allows users to record and replay computer actions, such as clicking, typing, etc on Chrome. 

Your final repo should contain the following 3 components:
1) A chrome extension that captures user actions on a Chrome browser and allows users to download action traces.
2) A script that takes in the recorded action trace and replays the same sequence of actions on a browser.
3) The recorded action trace of the following flow:
    1. Navigate to https://chatgpt.com
    2. Engage in a multiround conversation with ChatGPT. Use Search mode for at least one of the queries.

## Tips
The workflow we've asked you to record doesn't necessarily require computer actions beyond clicking and typing, but you are encouraged to implement more involved actions, such as scrolling, click and drag, etc. if you have time.

There are many possible implementations of this problem. The Chrome DevTools recorder uses HTML selectors. Another possible solution is the use of multimodal models or OCR for element detection. Think about the tradeoffs between robustness and generalizability. If you want to explain any part of your implementation, feel free to add a markdown to this repository.

## Project Summary
### Chrome Extension
This feature operates fully as intended. It tracks clicking & input events on the DOM through `content.js`. Additional behaviors in the `popup.js` and `background.js` ensure persistence through website redirects, and pause recording on invalid urls (such as chrome://). The recorded actions are saved as a list of objects (which contain action type, timestamp, and value if applicable) in the JSON file, which is used by the replay system.

### Replay Script
Running this script requires pipenv & a working ChromeDriver for Selenium. It simply iterates and executes each action in the provided JSON while matching timestamps. Unfortunately, the chatgpt loaded by Selenium is NOT the same as that in a regular chrome browser. Additionally, chat requests through the Selenium browser simply do not go through. I believe these are probably captcha measures OpenAI is taking (which makes sense). When I noticed this, I decided to switch up the approach to see if I could get replays to execute through the chrome extension, but ran out of time to fully implement this idea.

### Implementation Analysis & Next Steps
The XPath method to tracking actions is definitely a more robust approach to the recording side of this project. That being said, there are several points of failure since the DOM structure of a webpage can be quite dynamic. Given more time, creating a consistent Video/Text/Image or OCR model would give more adaptability without the need for in-depth testing and reiteration (something I found myself doing quite often as I revised the action recognition and text extraction logic).

On the action execution side, I should have tested a hardcoded end-to-end chatgpt conversation using Selenium before committing to implementing it fully. Although the tool I created works in more general/relaxed cases, it doesn't operate on the ChatGPT website correctly. In this case, a multimodal or OCR model would again be a viable option as it eliminates the need for an external driver (as we can use other python libraries to interface with the browser).

### Demo Video
Quick Video demo (not on ChatGPT)
![demo](demo.gif)