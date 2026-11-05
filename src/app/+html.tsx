import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* Force Chrome to read your custom manifest immediately */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#004085" />
        <link rel="apple-touch-icon" href="/icon-192.png" />

        {/* Force Service Worker Registration before React even loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful');
                    
                    // 1. Force the browser to check for a new Firebase deployment instantly
                    registration.update();

                    // 2. Listen for the new update downloading
                    registration.onupdatefound = function() {
                      const installingWorker = registration.installing;
                      installingWorker.onstatechange = function() {
                        // 3. When the new code is fully downloaded, send a signal to React!
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          console.log('New update found! Alerting React...');
                          window.dispatchEvent(new Event('hiywa-update-available'));
                        }
                      };
                    };
                  }).catch(function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}