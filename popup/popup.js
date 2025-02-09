document.getElementById("clicked").addEventListener("click", addWebsite);
addEventListener("hashchange", windowurlListen);

const toggleExtensionState = () => {
    chrome.storage.local.get(["isRunning"], result => {
        const isRunning = result.isRunning || false
        const newState = !isRunning

        chrome.storage.local.set({isRunning: newState} , () => {
            updateUI(newState)
            console.log(newState)
        })
    })
}

const inactiveTagElement = document.getElementById("inactiveSpan"); 
const activeTagElement = document.getElementById("activeSpan");

activeTagElement.addEventListener("click", toggleExtensionState);
inactiveTagElement.addEventListener("click", toggleExtensionState);
    
chrome.storage.local.get(["isRunning"], (result) => {
    updateUI(result.isRunning || false);
});

const hideElement = (elem) => {
    elem.style.display = 'none'
}

const showElement = (elem) => {
    elem.style.display = ''
}

const handleOnStartState = () => {
    showElement(activeTagElement)
    hideElement(inactiveTagElement)
}

const handleOnStopState = () => {
    showElement(inactiveTagElement)
    hideElement(activeTagElement)
}

async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

const updateUI = (isRunning) => {
    if (isRunning) {
        handleOnStartState()
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            chrome.scripting.executeScript({
              target: { tabId: tabId },
                function: () => { 
                    const overlay = document.createElement('div');
                    overlay.style.position = 'fixed';
                    overlay.id = 'overlay';  // Unique ID
                    overlay.style.top = '0';
                    overlay.style.left = '0';
                    overlay.style.width = '100%';
                    overlay.style.height = '100%';
                    overlay.style.backgroundColor = '#000';  // Semi-transparent black
                    overlay.style.zIndex = '9999';  // Make sure it’s on top of other content
                    document.body.appendChild(overlay);
                    
                    console.log(document.body.getinnerHTML);
                 }
            });
            console.log('injected', tabId)
          })
            
        
    } else {
        handleOnStopState()

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tabId = tabs[0].id;
            chrome.scripting.executeScript({
              target: { tabId: tabId },
                function: () => { 
                    const overlay = document.getElementById('overlay');  // Select the overlay div
                    if (overlay) {
                      overlay.remove();  // Removes the div
                    }                    
                 }
            })
        })

    }
}

document.getElementById('signin').addEventListener('click', () => {

chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
    const headers = new Headers({
        'Authorization' : 'Bearer ' + token,
        'Content-Type': 'application/json'
    })

   console.log(token);
    
    const queryParams = { headers };

    // returns a String of the current event
    // if no event returns "None" 
    // (untested method)
    const detectCurr = () => {
        const res = detectCurrHelper();
        if (res < 1) {
            return "None";
        }
        if (detectCurrHelper[0].start.dateTime <= new Date().toISOString()) {
            return detectCurrHelper[0].summary;
        }
        return "None";
    }

    const detectCurrHelper = new URLSearchParams({
        "orderBy": "startTime",
        "singleEvents": "true",
        "maxResults": "1",
        "timeMin": new Date().toISOString()  // Get only future events
    });
  
    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', queryParams)
    .then((response) => response.json()) // Transform the data into json
    .then(function(data) {
        console.log(data);
      })

    })
})

const websitesAdded = []
const isActive = false; 

const isBlocked = (url) => {
    if(websitesAdded.includes(url)){
        /*let registerScripts = {
            id: 'test',
            "matches" : websitesAdded,
            "css": [
                    "popup/style.css"
                ]
        };
       chrome.scripting.registerContentScripts([registerScripts]).then(() => {
        })      } */
       return true;
    }
    else {return false};
}

function addWebsite(){
    let input = document.getElementById("websiteadd").value;
    websitesAdded.push(input);
    isBlocked(input)
}

function windowurlListen(){
    isBlocked(HashChangeEvent.newURL);
}