import React, { useEffect, useRef } from 'react';

/**
 * A React component to safely load an Adsterra script-based ad unit.
 */
const AdsterraComponent = ({ atKey, atFormat, atHeight, atWidth }) => {
  const adRef = useRef(null);

  useEffect(() => {
    // This effect runs when the component is added to the page
    if (adRef.current) {
      // 1. Create the script element
      const script = document.createElement('script');
      script.type = 'text/javascript';
      
      // 2. Define the ad options
      window.atOptions = {
        'key': atKey,
        'format': atFormat,
        'height': atHeight,
        'width': atWidth,
        'params': {}
      };
      
      // 3. Set the script source to load the ad
      script.src = `//www.effectivecreativeformat.com/${atKey}/invoke.js`;
      
      // 4. Append the script to the component's div
      adRef.current.appendChild(script);

      // 5. Cleanup function
      return () => {
        if (adRef.current) {
          adRef.current.innerHTML = '';
        }
        window.atOptions = null;
      };
    }
  }, [atKey, atFormat, atHeight, atWidth]); // Re-run if props change

  // This div is the container where the script will place the ad
  return <div ref={adRef} className="adsterra-ad-container" />;
};

export default AdsterraComponent;