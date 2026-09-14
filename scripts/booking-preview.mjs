/** Local review only: a form submission never leaves the dev server. */
export function bookingPreview() {
  return {
    name: 'local-booking-preview',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__preview/booking', (request, response) => {
        response.setHeader('Content-Type', 'application/json');
        if (request.method !== 'POST') {
          response.statusCode = 405;
          response.end(JSON.stringify({ ok: false }));
          return;
        }
        // Discard the test submission; no storage, logging or external requests.
        request.resume();
        request.on('end', () => {
          setTimeout(() => response.end(JSON.stringify({ ok: true, preview: true })), 400);
        });
      });
    },
  };
}
