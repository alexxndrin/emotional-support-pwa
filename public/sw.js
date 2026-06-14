const CACHE_NAME = 'tochka-opory-v4';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/create-edit.html',
    '/session.html',
    '/profile.html',
    
    '/css/style.css',
    '/css/dashboard.css',
    '/css/create-edit.css',
    '/css/session.css',
    '/css/profile.css',
    
    '/js/dashboard.js',
    '/js/create-edit.js',
    '/js/session.js',
    '/js/profile.js',
    '/js/toast.js',
    '/js/script.js',
    '/js/storage.js',
    
    '/manifest.webmanifest',
    
    '/fonts/montserrat-regular.woff2',
    '/fonts/nasalization-rg.otf',
    
    '/media/brown.mp3',
    '/media/click.mp3',
    '/media/forest.mp3',
    '/media/rain.mp3',
    '/media/white.mp3',
    
    '/images/logo.png',
    '/images/logo.svg',
    '/images/index1.png',
    '/images/index2.png',
    '/images/inst.png',
    '/images/tg.png',
    '/images/vk.png',
    '/images/icon-action.png',
    '/images/icon-anchor.png',
    '/images/icon-breathing.png',
    '/images/icon-delete.png',
    '/images/icon-edit.png',
    '/images/icon-grounding.png',
    '/images/icon-simple.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            try {
                await cache.addAll(ASSETS_TO_CACHE);
            } catch (error) {
                console.error('Cache addAll error:', error);
                // Добавляем по одному файлу, если addAll не сработал
                for (const url of ASSETS_TO_CACHE) {
                    try {
                        await cache.add(url);
                    } catch (e) {
                        console.error('Failed to cache:', url, e);
                    }
                }
            }
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Пропускаем запросы, которые не GET или к chrome-extension
    if (event.request.method !== 'GET' || 
        event.request.url.includes('chrome-extension') ||
        event.request.url.includes('extension')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            
            // Пробуем загрузить из сети
            return fetch(event.request).then((networkResponse) => {
                // Кэшируем успешные ответы для будущего оффлайн-режима
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch((error) => {
                console.log('Fetch failed:', error);
                // Для HTML-страниц возвращаем index.html при оффлайн-режиме
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
                return new Response('Офлайн-режим: контент недоступен', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            });
        })
    );
});