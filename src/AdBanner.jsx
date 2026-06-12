import { useEffect, useRef } from 'react';

const PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID || '';

const AdBanner = ({ slot, format = 'auto', className = '' }) => {
    const pushed = useRef(false);

    useEffect(() => {
        if (!PUBLISHER_ID || pushed.current) return;
        pushed.current = true;
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {}
    }, []);

    if (!PUBLISHER_ID) return null;

    return (
        <div className={`overflow-hidden ${className}`}>
            <p className="text-center text-xs text-gray-400 mb-1 tracking-wide uppercase">Advertisement</p>
            <ins
                className="adsbygoogle"
                style={{ display: 'block' }}
                data-ad-client={PUBLISHER_ID}
                data-ad-slot={slot}
                data-ad-format={format}
                data-full-width-responsive="true"
            />
        </div>
    );
};

export default AdBanner;
