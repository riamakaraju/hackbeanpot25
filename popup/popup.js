const statusTagElement = document.getElementById("statusTag");
const inactiveTagElement = document.getElementById("inactiveTag");
const activeTagElement = document.getElementById("activeTag");

document.getElementById('signin').addEventListener('click', () => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error('Auth token error:', chrome.runtime.lastError);
        document.getElementById('status').innerText = 'Error signing in';
        return;
      }
  
      console.log('Token received:', token);
      document.getElementById('status').innerText = 'Successfully signed in!';
      
      // Fetch the user's Google Calendar events
      fetchCalendarData(token);
    });
  });
  
  function fetchCalendarData(token) {
    fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(data => {
        console.log('Fetched calendar events:', data);
        displayEvents(data.items);
      })
      .catch(error => console.error('Error fetching calendar data:', error));
  }
  
  function displayEvents(events) {
    const status = document.getElementById('status');
    status.innerHTML = '<h2>Upcoming Events:</h2>';
  
    events.slice(0, 5).forEach(event => {
      const eventTime = event.start.dateTime || event.start.date;
      status.innerHTML += `<p><strong>${event.summary}</strong> - ${eventTime}</p>`;
    });
  }
  