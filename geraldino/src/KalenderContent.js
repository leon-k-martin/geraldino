import React from 'react';
import './KalenderContent.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';

function GoogleCalendar() {
    return (
      <iframe 
        className="google-calendar-iframe"
        src="https://calendar.google.com/calendar/embed?height=600&wkst=2&bgcolor=%23ffffff&ctz=Europe%2FBerlin&showTitle=0&showNav=1&title=Geraldino%20Tour&showTz=0&showCalendars=0&showPrint=1&showDate=1&src=cmptM3Vla2FqZnE3bnFxc20xOHVuYmNsMWN1MmF1MDhAaW1wb3J0LmNhbGVuZGFyLmdvb2dsZS5jb20&color=%237CB342"
        title='Kalender'
      ></iframe>
    );
  }
  
  export default GoogleCalendar;
  