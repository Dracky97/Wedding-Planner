import React, { useEffect, useRef } from 'react';

/**
 * A React component to safely load an Adsterra Native Banner.
 * This component renders the target <div> and then loads the
 * script that finds and fills that div.
 */
const AdsterraNativeBanner = ({ scriptSrc, containerId }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // 1. Check if the ad container div exists
    if (!containerRef.current) {
      return;
    }

    // 2. Create the script element
    const scriptElement = document.createElement('script');
    scriptElement.async = true;
    scriptElement.setAttribute('data-cfasync', 'false');
    scriptElement.src = scriptSrc;

    // 3. Append the script to the document body.
    // The script will run and find the div by its ID.
    document.body.appendChild(scriptElement);

    // 4. Cleanup function: This runs when the component is unmounted
    return () => {
      // Remove the script
      document.body.removeChild(scriptElement);
      
      // Clear the content of the ad container
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [scriptSrc, containerId]); // Re-run if these props ever change

  // Render the target <div> that the script is looking for
  return <div id={containerId} ref={containerRef} />;
};

export default AdsterraNativeBanner;