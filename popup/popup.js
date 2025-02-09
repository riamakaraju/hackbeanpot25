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

const updateUI = (isRunning) => {
    if (isRunning) {
        handleOnStartState()
    } else {
        handleOnStopState()
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
