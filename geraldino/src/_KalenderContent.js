import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import ICAL from 'ical.js';

import kalenderText from './text/Kalender.md';

const localizer = momentLocalizer(moment);
// const iCalURL = 'webcall://p70-caldav.icloud.com/published/2/MTIxMDMwNDg2OTEyMTAzMMka9_w2YR-dYArxhpu_Oh2BBpQz2Olge1VSWQpXzmhduN2LFLjB9Awr5a0ncL3CFtTK3Ag9cBSRXc1wyzYjveU';

const iCalURL = "https://calendar.google.com/calendar/ical/rjm3uekajfq7nqqsm18unbcl1cu2au08%40import.calendar.google.com/public/basic.ics"

const KalenderContent = () => {
    const [markdown, setMarkdown] = useState('');
    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetch(kalenderText)
            .then((response) => response.text())
            .then((text) => setMarkdown(text))
            .catch((error) => console.error('Error fetching markdown:', error));

        fetch(iCalURL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then((data) => {
                const jcalData = ICAL.parse(data);
                const comp = new ICAL.Component(jcalData);
                const icalEvents = comp.getAllSubcomponents('vevent');
                
                const parsedEvents = icalEvents.map((eventItem) => {
                    const event = new ICAL.Event(eventItem);
                    return {
                        start: event.startDate.toJSDate(),
                        end: event.endDate.toJSDate(),
                        title: event.summary
                    };
                });
        
                setEvents(parsedEvents);
            })
            .catch((error) => console.error('Error fetching iCal:', error));
    }, []);

    return (
        <div>
            <ReactMarkdown>{markdown}</ReactMarkdown>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
            />
            {/* <iframe src="https://calendar.google.com/calendar/embed?src=rjm3uekajfq7nqqsm18unbcl1cu2au08%40import.calendar.google.com&ctz=Europe%2FBerlin" style="border: 0" width="800" height="600" frameborder="0" scrolling="no"></iframe> */}
            <div>
                <h2>Tour Dates</h2>
                <ul>
                    {events.map((event, index) => (
                        <li key={index}>
                            {moment(event.start).format('MMMM DD, YYYY')} - {event.title}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default KalenderContent;
