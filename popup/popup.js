const statusTagElement = document.getElementById("statusTag");
const inactiveTagElement = document.getElementById("inactiveTag");
const activeTagElement = document.getElementById("activeTag");

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
