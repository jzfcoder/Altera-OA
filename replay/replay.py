import time
import json
import os

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Must have ChromeDrive added to PATH
SHOW_BROWSER = True


def load_recorded_actions(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)


def initialize_driver():
    chrome_options = Options()
    if not SHOW_BROWSER:
        chrome_options.add_argument("--headless")
    service = Service()
    driver = webdriver.Chrome(service=service, options=chrome_options)
    return driver


def replay_actions(driver, recorded_actions):
    wait = WebDriverWait(driver, 10)

    for action in recorded_actions:
        timestamp = action['timestamp']
        action_type = action['type']
        
        # Wait for the time difference between actions (for realism)
        if timestamp > time.time() * 1000:
            time.sleep((timestamp - time.time() * 1000) / 1000.0)

        if action_type == 'pageVisit':
            print(f"Visiting: {action['url']}")
            driver.get(action['url'])
            time.sleep(2)  # Wait for the page to load

        elif action_type == 'click':
            try:
                element = wait.until(EC.element_to_be_clickable((By.XPATH, action['selector'])))
                print(f"Clicking on element: {action['selector']}")
                element.click()
                time.sleep(1)
            except Exception as e:
                print(f"Error during click: {e}")

        elif action_type == 'input':
            try:
                element = wait.until(EC.presence_of_element_located((By.XPATH, action['selector'])))
                print(f"Inputting text into element: {action['selector']}")
                element.clear()  # Clear the field before typing
                element.send_keys(action['value'])
                time.sleep(1)
            except Exception as e:
                print(f"Error during input: {e}")

        elif action_type == 'scroll':
            print(f"Scrolling to position x: {action['x']}, y: {action['y']}")
            driver.execute_script(f"window.scrollTo({action['x']}, {action['y']});")
            time.sleep(1)


def main():
    action_trace_path = "action_trace.json"
    recorded_actions = load_recorded_actions(action_trace_path)
    driver = initialize_driver()
    replay_actions(driver, recorded_actions)
    driver.quit()


if __name__ == "__main__":
    main()
