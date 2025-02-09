document.addEventListener('DOMContentLoaded', () => {
    let cachedToken = null;
    let tokenExpiry = null; // Store token expiry time

    const getAuthToken = () => {
        return new Promise((resolve, reject) => {
            const now = Date.now();
            if (cachedToken && tokenExpiry && tokenExpiry > now) {
                console.log("Using cached token:", cachedToken);
                resolve(cachedToken);
                return; // Important: Exit the promise if token is valid
            }

            chrome.identity.getAuthToken({ 'interactive': true }, function (token) {
                if (chrome.runtime.lastError) {
                    console.error("Failed to get token:", chrome.runtime.lastError);
                    reject(new Error("Failed to get token"));
                    return; // Exit the callback on error
                }

                if (!token) {  // Handle null token
                    console.error("Token is null");
                    reject(new Error("Token is null"));
                    return; // Exit the callback on null token
                }

                cachedToken = token;

                //  Get token expiry (this requires a separate request to Google's tokeninfo endpoint)
                fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`)
                    .then(response => response.json())
                    .then(tokenInfo => {
                        tokenExpiry = Date.now() + (tokenInfo.expires_in * 1000); // Store expiry time in milliseconds
                        console.log("Token expires in:", tokenInfo.expires_in, "seconds. Stored expiry:", tokenExpiry);
                        resolve(token);
                    })
                    .catch(err => {
                      console.error("Error getting token info:", err);
                      reject(err); // Reject if token info fetch fails
                    });


            });
        });
    };

    function updateTime() {
        const now = new Date();
        document.getElementById('currentTime').innerText = now.toLocaleTimeString();
      }
      updateTime();
      setInterval(updateTime, 1000);      

    const fetchEvents = async (queryParams) => {
        // Ensure token is available
        if (!cachedToken) {
            // If cachedToken is missing, fetch it
            cachedToken = await getAuthToken();
        }
    
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
            return [];  
        }
    };
    
    const detectCurr = async () => {
        const token = await getAuthToken(); 
        const detectCurrHelper = new URLSearchParams({
            "orderBy": "startTime",
            "singleEvents": "true",
            "maxResults": "1",
            "timeMin": new Date().toISOString()
        });
    
        const res = await fetchEvents(detectCurrHelper, token); 
        if (res === null) {
            return "No events";
        }
        if (res.length < 1) {
            return "No events";
        }
        if (res[0].start.dateTime <= new Date().toISOString()) {
            // console.log(res[0].start.dateTime);
            // console.log(new Date().toISOString);
            return res[0].summary;
        }
        if (isAllDayEvent(res[0])) {
            return res[0].summary;
        }
        return "No events";
    };
    
    const createEventChecker = () => {
        return {
            getCurrentEventStatus: async () => {
                return await detectCurr(); // Method to get current event status
            },
            /*
            getNextThreeEvents: async () => {
                return await detectNextThreeEvents(); 
            }
            */
            getNextThreeEvents: dummyDetectNextThreeEvents 
        };
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

    const dummyDetectNextThreeEvents = async () => {
        // Dummy data for testing
        const dummyEvents = [
            {
                summary: "Event 1",
                start: { dateTime: "2025-02-10T09:00:00Z" },
                end: { dateTime: "2025-02-10T10:00:00Z" }
            },
            {
                summary: "Event 2",
                start: { dateTime: "2025-02-10T11:00:00Z" },
                end: { dateTime: "2025-02-10T12:00:00Z" }
            },
            {
                summary: "Event 3",
                start: { dateTime: "2025-02-10T13:00:00Z" },
                end: { dateTime: "2025-02-10T14:00:00Z" }
            },
            {
                summary: "Event 4",
                start: { dateTime: "2025-02-10T15:00:00Z" },
                end: { dateTime: "2025-02-10T16:00:00Z" }
            }
        ];
    
        return dummyEvents.slice(0, 3);
    };
    
    

    // detects the next three events not including the current one
    const detectNextThreeEvents = async () => {
        const currentEvent = await detectCurr();
        const useFirst = currentEvent === "No events";
        const nextFourEvents = await detectNextFourEvents();
        return detectNextThreeEventsHelp(nextFourEvents, useFirst);
    };

    // helper for threeEventsString
    const eventToString = async (event) => {
        return event.summary + "(" + event.dateTime.substring(5,10) + ", " + event.dateTime.substring(12,16);
    }
    

    // takes in a list of 3 events and returns list of strings
    const threeEventsString = async () => {
        let res = new Array();
        const threeEvents = await dummyDetectNextThreeEvents();
        for(let i = 0; i < threeEvents.length; i++)  {
            res.push(eventToString(threeEvents[i]));
        }
        console.log("hi" + res);
        return res;
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

    // Purpose: Toggles turns the blocker on and off using (extension state)
    const toggleExtensionState = () => {
        chrome.storage.local.get(["isRunning"], result => {
            const isRunning = result.isRunning || false;
            const newState = !isRunning;

            chrome.storage.local.set({ isRunning: newState }, () => {
                updateBlockState(1, newState);
                console.log(`updated blockerOn to ${newState}`);
            });
        });
    };

    // Purpose: Edits onBlockedWebsite state to the boolean passed in
    const editOnBlockedWebsite = (value) => {
        updateBlockState(2, value);
        console.log(`updated onBlockedWebsite to ${value}`);
    }

    // Purpose: Edits eventRunning state with the value passed in
    const editEventRunning = (value) => {
        updateBlockState(0, value);
        console.log(`updated eventRunning to ${value}`);
    }

    const websitesAdded = []
    const isActive = false; 

    // Returns true if url is part of blocklist. 
    const isBlocked = (url) => {
        chrome.storage.local.get(["urlList"], result => {
            const urls = result.urlList || [];
            return urls.includes(url);
        })
    }


    // Returns true if url is part of blocklist, uses a callback for some saving stuff.
    const isBlockedWithCallback = (url, callback) => {
        chrome.storage.local.get(["urlList"], result => {
            const urls = result.urlList || [];
            console.log(urls.includes(url));
            callback(urls.includes(url));  // Pass the result to the callback
        });
    }
   
    
    const urlPattern = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;

    function addWebsite() {
        let input = document.getElementById("websiteAdd").value;
        if (urlPattern.test(input)) {
            console.log(`Valid URL (${input})`);
            if (!isBlocked(input)) {
                chrome.storage.local.get(["urlList"], result => {
                    const urls = result.urlList || [];
                    urls.push(input);
                    console.log(`Updated blocklist. URLs: ${urls}`);
                    chrome.storage.local.set({ urlList: urls });
                    input.value = '';
                })
            }
        } else {
            console.log(`Invalid URL (${input})`);
        }
    }
    
    function windowurlListen(){
        isBlocked(HashChangeEvent.newURL);
        console.log("tab changed")
    }


    // Purpose: Updates the blockState based on the values passed in. Chooses to update eventRunning, blockerOn, or onBlockedWebsite
    // based on 'edit' int.
    const updateBlockState = (edit, value) => {
        chrome.storage.local.get(["blockState"], result => {
            const blockState = result.blockState || {eventRunning: false, blockerOn: false, onBlockedWebsite: false};
            const newState = {
                eventRunning: edit == 0 ? value : blockState.eventRunning,
                blockerOn: edit == 1 ? value : blockState.blockerOn,
                onBlockedWebsite: edit == 2 ? value : blockState.onBlockedWebsite,
            }

            chrome.storage.local.set({ blockState: newState }, () => {
                updateUI(newState);
                updateToggleButton(newState);
                console.log(`
                            eventRunning:  ${newState.eventRunning}
                            blockerOn: ${newState.blockerOn}
                            onBlockedWebsite: ${newState.onBlockedWebsite}
                            blockState literal is ${newState}`);
            })
        })
    }

    // Elements
    const inactiveTagElement = document.getElementById("inactiveSpan");
    const activeTagElement = document.getElementById("activeSpan");
    const addWebsiteConfirm = document.getElementById("clicked");

    activeTagElement.addEventListener("click", toggleExtensionState);
    inactiveTagElement.addEventListener("click", toggleExtensionState);
    addWebsiteConfirm.addEventListener("click", addWebsite);

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

    const updateToggleButton = (blockState) => {
        if (blockState.blockerOn) {
            handleOnStartState();
        } else {
            handleOnStopState();
        }
    }

    const updateUI = (blockState) => {
        if (blockState.blockerOn && blockState.onBlockedWebsite && blockState.eventRunning) {
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

    const checkCurrentWebsite = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const currentUrl = tabs[0].url;  // The URL of the active tab
            
            // Call isBlocked with a callback that updates the state
            isBlocked(currentUrl, (blocked) => {
                editOnBlockedWebsite(blocked);  // Pass the result to update state
            });
        });
    }

    const updateNextThreeEvents = async () => {
        let nextEvents = await eventChecker.getNextThreeEvents();
        let eventListText = nextEvents.map(event => `${event.summary} (${event.start.dateTime} - ${event.end.dateTime})`).join('\n');
        document.getElementById('nextEvents').innerText = `Next 3 Events:\n${eventListText}`;
    };
    updateNextThreeEvents();
    updateStatus();
    setInterval(updateStatus, 1000);  // Update every 1 second
    setInterval(checkCurrentWebsite, 1000); // Checks current website every second
});