document.addEventListener('DOMContentLoaded', () => {
    const inactiveTagElement = document.getElementById("inactiveSpan");
    const activeTagElement = document.getElementById("activeSpan");
    
    activeTagElement.addEventListener("click", toggleExtensionState);
    inactiveTagElement.addEventListener("click", toggleExtensionState);
    
    chrome.storage.local.get(["isRunning"], (result) => {
        updateUI(result.isRunning || false);
    });
})

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

const updateUI = (isRunning) => {
    if (isRunning) {
        handleOnStartState()
    } else {
        handleOnStopState()
    }
}
    
chrome.identity.getAuthToken({ 'interactive': false }, function(token) {
document.getElementById('signin').addEventListener('click', () => {


chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
    const headers = new Headers({
        'Authorization' : 'Bearer ' + token,
        'Content-Type': 'application/json'
    })

   console.log(token);
  
    const queryParams = { headers };
  
    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', queryParams)
    .then((response) => response.json()) // Transform the data into json
    .then(function(data) {
        console.log(data);
      })


    })
})
