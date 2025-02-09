/*document.addEventListener("DOMContentLoaded", function () {
  // Array of event objects
  let events = [
      { name: "Hair Appointment", date: "Feb 10, 2025", time: "10:00 AM" },
      { name: "Exam 3", date: "Feb 12, 2025", time: "2:00 PM" },
      { name: "Birthday", date: "Feb 15, 2025", time: "All Day" }
  ];

  // Loop through events and update the UI
  for (let i = 0; i < events.length; i++) {
      let eventElement = document.getElementById(`event${i + 1}`);
      eventElement.innerHTML = `<strong>${i + 1}. ${events[i].name}</strong><br>
                                📅 ${events[i].date} | 🕒 ${events[i].time}`;
  }
});/*
