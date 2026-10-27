/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "8d9483b7801c457d7fc072a65d67e387"
  }, {
    "url": "pwa-512x512.png",
    "revision": "4360c70c53ec772bf59b25195b56407b"
  }, {
    "url": "pwa-192x192.png",
    "revision": "0c98680999440e3fb4c498711de11dab"
  }, {
    "url": "index.html",
    "revision": "3872b4c4f0ebe37b1e538dd082369b65"
  }, {
    "url": "icon.svg",
    "revision": "f8bde9bfdb51d4bac9675f3b079f0e37"
  }, {
    "url": "icon-maskable.svg",
    "revision": "dffb3b4afa39593193439404f9c40d29"
  }, {
    "url": "favicon.ico",
    "revision": "c0307d1259e6bd03d59477b23cc2a27a"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "85c934fd57c1946f468bc13bf899ed53"
  }, {
    "url": "404.html",
    "revision": "ea0414319989a3f42e258c7edf00e460"
  }, {
    "url": "assets/index-DDp-bmvP.css",
    "revision": null
  }, {
    "url": "assets/index-B0meWKub.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "85c934fd57c1946f468bc13bf899ed53"
  }, {
    "url": "favicon.ico",
    "revision": "c0307d1259e6bd03d59477b23cc2a27a"
  }, {
    "url": "icon.svg",
    "revision": "f8bde9bfdb51d4bac9675f3b079f0e37"
  }, {
    "url": "pwa-192x192.png",
    "revision": "0c98680999440e3fb4c498711de11dab"
  }, {
    "url": "pwa-512x512.png",
    "revision": "4360c70c53ec772bf59b25195b56407b"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "8d9483b7801c457d7fc072a65d67e387"
  }, {
    "url": "manifest.webmanifest",
    "revision": "0a81495c54ca088df258ce7ea526bfda"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
