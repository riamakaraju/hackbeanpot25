const statusTagElement = document.getElementById("statusTag");
const inactiveTagElement = document.getElementById("inactiveTag");
const activeTagElement = document.getElementById("activeTag");

chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
    //stuff
})
