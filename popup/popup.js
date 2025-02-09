document.addEventListener('DOMContentLoaded', () => {
    // Create the event checker function
    const createEventChecker = () => {
        return {
            getCurrentEventStatus: async () => {
                return await detectCurr();  // Ensure detectCurr is in scope
            }
        };
    };

    // Define all your methods inside this listener
    const fetchEvents = async (queryParams) => {
        const headers = new Headers({
            'Authorization': 'Bearer ' + cachedToken,
            'Content-Type': 'application/json'
        });

        try {
            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?' + queryParams.toString(), {
                method: 'GET',
                headers: headers
            });
            const data = await response.json();
            return data.items;
        } catch (error) {
            console.log('Error fetching events:', error);
            return [];  // Return empty array if there’s an error
        }
    };
    
    const detectCurr = async () => {
        const detectCurrHelper = new URLSearchParams({
            "orderBy": "startTime",
            "singleEvents": "true",
            "maxResults": "1",
            "timeMin": new Date().toISOString()
        });

        const res = await fetchEvents(detectCurrHelper);
        if (res.length < 1) {
            return "No events";
        }
        if (res[0].start.dateTime <= new Date().toISOString()) {
            return res[0].summary;
        }
        if (isAllDayEvent(res[0])) {
            return res[0].summary;
        }
        return "No events";
    };
    

    const isAllDayEvent = (event) => {
        return event.start.date && !event.start.dateTime;
    };

    const getCurrentEventStatus = async () => {
        const currentEvent = await detectCurr();
        return currentEvent;
    };

    const detectNextFourEvents = async () => {
        const events = await fetchEvents(detectNextFourSearchParams);
        return events;
    };

    const detectNextFourEventsWithNull = async () => {
        const events = await detectNextFourEvents();
        const eventList = new Array(4).fill(null); 
        for (let i = 0; i < eventList.length; i++) {
            eventList[i] = events[i]; 
        }
        return eventList;
    };

    // Next four events search params
    const detectNextFourSearchParams = new URLSearchParams({
        "orderBy": "startTime",
        "singleEvents": "true",
        "maxResults": "4",
        "timeMin": new Date().toISOString()
    });

    // Function to handle next 3 events
    const detectNextThreeEventsHelp = (eList, useFirst) => {
        let increment = 0;
        if (!useFirst) increment = increment + 1;
        const res = new Array(3);
        for (let i = 0 + increment; i < 3; i++) {
            res[i] = eList[i];
        }
        return res;
    };

    const detectNextThreeEvents = async (eventList) => {
        const currentEvent = await detectCurr();
        const useFirst = currentEvent === "No events";
        const nextFourEvents = await detectNextFourEventsWithNull();
        return detectNextThreeEventsHelp(nextFourEvents, useFirst);
    };

    // Get the auth token
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

    // Event listener for signin button
    document.getElementById('signin').addEventListener('click', () => {
        getAuthToken()
            .then(token => {
                const headers = new Headers({
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                });
                // Add other logic as needed for the authentication flow...
            });
    });

    // Toggle extension state
    const toggleExtensionState = () => {
        chrome.storage.local.get(["isRunning"], result => {
            const isRunning = result.isRunning || false;
            const newState = !isRunning;

            chrome.storage.local.set({ isRunning: newState }, () => {
                updateUI(newState);
                console.log(newState);
            });
        });
    };

    // Elements
    const inactiveTagElement = document.getElementById("inactiveSpan");
    const activeTagElement = document.getElementById("activeSpan");

    activeTagElement.addEventListener("click", toggleExtensionState);
    inactiveTagElement.addEventListener("click", toggleExtensionState);

    chrome.storage.local.get(["isRunning"], (result) => {
        updateUI(result.isRunning || false);
    });

    const hideElement = (elem) => {
        elem.style.display = 'none';
    };

    const showElement = (elem) => {
        elem.style.display = '';
    };

    const handleOnStartState = () => {
        showElement(activeTagElement);
        hideElement(inactiveTagElement);
    };

    const handleOnStopState = () => {
        showElement(inactiveTagElement);
        hideElement(activeTagElement);
    };

    const updateUI = (isRunning) => {
        if (isRunning) {
            handleOnStartState();
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
                    }
                });
            });
        } else {
            handleOnStopState();
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tabId = tabs[0].id;
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    function: () => {
                        const overlay = document.getElementById('overlay');
                        if (overlay) {
                            overlay.remove();
                        }
                    }
                });
            });
        }
    };

    // Event status update
    const eventChecker = createEventChecker();

    const updateStatus = async () => {
        let status = await eventChecker.getCurrentEventStatus();
        document.getElementById('eventStatus').innerText = status;
    };

    updateStatus();
    setInterval(updateStatus, 1000);  // Update every 1 second
});
