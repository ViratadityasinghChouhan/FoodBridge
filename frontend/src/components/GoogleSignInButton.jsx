import { useEffect, useRef, useState } from 'react';

const GoogleSignInButton = ({ onCredential, text = 'signin_with' }) => {
  const buttonRef = useRef(null);
  const [clientId, setClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || '');
  const [isCheckingConfig, setIsCheckingConfig] = useState(!clientId);
  const message = clientId ? '' : 'Google sign-in is not configured. Add GOOGLE_CLIENT_ID in backend/.env and restart the server.';

  useEffect(() => {
    if (clientId) {
      return;
    }

    let isMounted = true;
    fetch('/api/auth/google-client-id')
      .then((response) => response.ok ? response.json() : { clientId: '' })
      .then((data) => {
        if (isMounted && data.clientId) {
          setClientId(data.clientId);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) {
          setIsCheckingConfig(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [clientId]);

  useEffect(() => {
    if (!clientId) {
      return;
    }

    const renderButton = () => {
      if (!window.google || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: buttonRef.current.offsetWidth || 320,
        text,
      });
    };

    if (window.google) {
      renderButton();
      return;
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      existingScript.addEventListener('load', renderButton, { once: true });
      return () => existingScript.removeEventListener('load', renderButton);
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderButton;
    document.body.appendChild(script);
  }, [clientId, onCredential, text]);

  return (
    <div>
      <div ref={buttonRef} className="min-h-10 w-full" />
      {isCheckingConfig && <p className="mt-2 text-xs font-medium text-slate-500">Checking Google sign-in...</p>}
      {!isCheckingConfig && message && <p className="mt-2 text-xs font-medium text-amber-700">{message}</p>}
    </div>
  );
};

export default GoogleSignInButton;
