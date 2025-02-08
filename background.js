fetch(chrome.runtime.getURL("secrets.json"))
    .then(response => response.json())
    .then(data => {
        const extensionKey = data.key;
        console.log("Loaded extension key:", extensionKey);
    })
    .catch(error => console.error("Error loading extension key:", error));
