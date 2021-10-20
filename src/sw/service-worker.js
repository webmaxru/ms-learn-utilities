/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { setCacheNameDetails, clientsClaim } from 'workbox-core';
import { StaleWhileRevalidate } from 'workbox-strategies';
import { googleFontsCache, imageCache } from 'workbox-recipes';
import { BroadcastUpdatePlugin } from 'workbox-broadcast-update';
import * as googleAnalytics from 'workbox-google-analytics';

async function messageClient(event, messageType) {
  if (!event.clientId) return;

  // Get the client.
  const client = await clients.get(event.clientId);
  // Exit early if we don't get the client.
  // Eg, if it closed.
  if (!client) return;

  // Send a message to the client.
  client.postMessage({
    type: messageType,
  });
}

// SETTINGS

// Claiming control to start runtime caching asap
clientsClaim();

// Use to update the app after user triggered refresh
//self.skipWaiting();

// Setting custom cache names
setCacheNameDetails({ precache: 'wb6-precache', runtime: 'wb6-runtime' });

// PRECACHING

// Precache and serve resources from __WB_MANIFEST array
precacheAndRoute(self.__WB_MANIFEST);

// NAVIGATION ROUTING

// This assumes /index.html has been precached.
const navHandler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(navHandler, {
  denylist: [new RegExp('/404.html')], // Also might be specified explicitly via allowlist
});
registerRoute(navigationRoute);

// STATIC RESOURCES

googleFontsCache({ cachePrefix: 'wb6-gfonts' });
imageCache({ cachePrefix: 'wb6-images', maxEntries: 10 });

// APP SHELL UPDATE FLOW

addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// RUNTIME CACHING

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/catalog'),
  async ({ event, request }) => {
    try {
      return await new StaleWhileRevalidate({
        cacheName: 'api-cache',
        plugins: [new BroadcastUpdatePlugin()],
      }).handle({ event, request });
    } catch (error) {
      messageClient(event, 'REQUEST_FAILED');
      return await fetch('/catalog.json');
    }
  }
);

registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/challenge') ||
    url.pathname.startsWith('/api/collection'),
  new StaleWhileRevalidate()
);

googleAnalytics.initialize();