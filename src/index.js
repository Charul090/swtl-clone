(() => {
  // render.js
  function render(html) {
    const textEncoder = new TextEncoder();
    const byteHtml = textEncoder.encode(html);
    const readAbleStream = new ReadableStream({
      pull: (controller) => {
        controller.enqueue(byteHtml);
        controller.close();
      }
    });
    const headers = {
      "Content-Type": "text/html"
    };
    const response = new Response(readAbleStream, { headers });
    return response;
  }

  // index.js
  self.addEventListener("install", (event) => {
    console.log("service worker installed", event);
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil(clients.claim());
    console.log("service worker activated random", event);
  });
  self.addEventListener("fetch", (event) => {
    if (event.request.mode === "navigate") {
      const html = `<html><body><h1>Check 1234</h1></body></html>`;
      event.respondWith(render(html));
    }
  });
})();
//# sourceMappingURL=index.js.map
