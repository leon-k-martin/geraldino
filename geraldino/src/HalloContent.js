import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import halloContent from './text/Hallo.md';

const transformURL = (uri) => {
    if (!uri.startsWith('http')) {
      return `https://raw.githubusercontent.com/leonmpunkt/geraldino/main/geraldino/src/images/${uri}`;
    }
    return uri;
  };

const Hallo = () => {
    const [markdown, setMarkdown] = useState('');

    useEffect(() => {
        fetch(halloContent)
            .then((response) => response.text())
            .then((text) => setMarkdown(text))
            .catch((error) => console.error('Error fetching markdown:', error));
    }, []);

    const components = {
        p: ({ node, children }) => {
            if (node.children[0] && node.children[0].tagName === "img") {
                const image = node.children[0];
                const metastring = image.properties.alt;
                const alt = metastring?.replace(/ *\{[^)]*\} */g, "");
                const metaWidth = metastring.match(/{([^}]+)x/);
                const metaHeight = metastring.match(/x([^}]+)}/);
                const width = metaWidth ? metaWidth[1] : "768";
                const height = metaHeight ? metaHeight[1] : "432";
                const isPriority = metastring?.toLowerCase().match('{priority}');
                const hasCaption = metastring?.toLowerCase().includes('{caption:');
                const caption = metastring?.match(/{caption: (.*?)}/)?.pop();
    
                return (
                    <div className="postImgWrapper">
                        <img
                            src={image.properties.src}
                            width={width}
                            height={height}
                            className="postImg"
                            alt={alt}
                        />
                        {hasCaption ? <div className="caption" aria-label={caption}>{caption}</div> : null}
                    </div>
                );
            }
            return <p>{children}</p>;
        }
    };    

    return (
        <div>
            <ReactMarkdown 
                components={components} 
                urlTransform={uri =>
                    uri.startsWith("http") ? uri : `${process.env.REACT_IMAGE_BASE_URL}${uri}`
                }
                rehypePlugins={[rehypeRaw]}
            >
                {markdown}
            </ReactMarkdown>
        </div>
    );
};

export default Hallo;
