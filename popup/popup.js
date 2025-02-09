document.getElementById("clicked").addEventListener("click", addWebsite);
addEventListener("hashchange", windowurlListen);

const toggleExtensionState = () => {
    chrome.storage.local.get(["isRunning"], result => {
        const isRunning = result.isRunning || false
        const newState = !isRunning

        chrome.storage.local.set({ isRunning: newState }, () => {
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
                        overlay.remove();
                    }
                }
            })
        })


    }
}

let cachedToken = null;

function getAuthToken() {
    return new Promise((resolve, reject) => {
        if (cachedToken) {
            resolve(cachedToken);
        } else {
            chrome.identity.getAuthToken({ 'interactive': true }, function (token) {
                if (chrome.runtime.lastError) {
                    reject(new Error("Failed to get token"));
                } else {
                    cachedToken = token;
                    resolve(token);
                }
            });
        }
    });
}

document.getElementById('signin').addEventListener('click', () => {
    getAuthToken()
        .then(token => {
            const headers = new Headers({
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            })
            // IMPORTANT!!!!!
            // !!!!! I PUT !!! IN FRONT OF THE MAIN METHODS WE'RE USING
            // EList == Event List

            // helper for detectCurr
            const detectCurrHelper = new URLSearchParams({
                "orderBy": "startTime",
                "singleEvents": "true",
                "maxResults": "1",
                "timeMin": new Date().toISOString()  // Get only future events
            });

            // !!!! returns a String of the current event and if there's no event rn, it returns "None" 
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

            const detectNextFourEvents = () => {
                return fetchEvents(detectNextFourSearchParams);
            }

            // returns next 4 events
            const detectNextFourSearchParams = new URLSearchParams({
                "orderBy": "startTime",
                "singleEvents": "true",
                "maxResults": "4",
                "timeMin": new Date().toISOString()  // Get only future events
            })

            // takes in a list of 4 and a boolean (MUST BE A LIST OF 4)
            const detectNextThreeEventsHelp = (eList, useFirst) => {
                let increment = 0;
                if (!useFirst) increment = increment + 1;
                const res = new URLSearchParams();
                for (let i = 0 + increment; i < 3 + increment; i++) {
                    res.append(eList[i]);
                }
                return res;
            }

            // !!!! returns next 3 events
            const detectNextThreeEvents = () => {
                let useFirst = false;
                if (detectCurr().equals("None")) useFirst = true;
                return detectNextThreeEventsHelp(detectNextFourEvents(), useFirst);
            }

            // Reusable function to fetch events
            function fetchEvents(queryParams) {
                const headers = new Headers({
                    'Authorization': 'Bearer ' + cachedToken,
                    'Content-Type': 'application/json'
                });

                return fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?' + queryParams.toString(), {
                    method: 'GET',
                    headers: headers
                })
                    .then((response) => response.json())
                    .then(function (data) {
                        return data.items;
                    })
                    .catch(function (error) {
                        console.log('Error fetching events:', error);
                        return [];
                    });
            }
        });
})

/*
const EListToString = (Elist) => {
    let res = new Array(Elist.length);
    for (let i = 0; i < Elist.length; i++) {
        res[i] = Elist
    }
}
*/

const websitesAdded = []
const isActive = false;

const isBlocked = (url) => {
    if (websitesAdded.includes(url)) {
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
    else { return false };
}

function addWebsite() {
    let input = document.getElementById("websiteadd").value;
    websitesAdded.push(input);
    isBlocked(input)
}

function windowurlListen() {
    isBlocked(HashChangeEvent.newURL);
    console.log("tab changed")
}