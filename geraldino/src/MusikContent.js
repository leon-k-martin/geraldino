// MusikContent.js
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Spotify } from 'react-spotify-embed'; // Import Spotify component
import musikText from './text/Musik.md';

const MusikContent = () => {
    const [markdown, setMarkdown] = useState('');

    useEffect(() => {
        fetch(musikText)
            .then((response) => response.text())
            .then((text) => setMarkdown(text))
            .catch((error) => console.error('Error fetching markdown:', error));
    }, []);

    return (
        <div>
            <ReactMarkdown>{markdown}</ReactMarkdown>
            <div className="spotify-grid">
                <Spotify link="https://open.spotify.com/album/48LozGzxriMsEVkVLDyoQc" />
                .
                <Spotify link="https://open.spotify.com/track/5DanruAbZROnIW7tIb6UyZ" />
                {/* Add more Spotify links here */}
            </div>
        </div>

    );
};

export default MusikContent;
