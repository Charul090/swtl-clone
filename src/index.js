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

  // router.js
  var Router = class {
    /**
     * 
     * @param {*} routes Array<{ path: string, render: (params, query, request) => string }>
     */
    constructor(routes) {
      this.routes = routes;
    }
    handleRequest(req) {
      const url = req.url;
      let pathInfo;
      const matchedRoute = this.routes.find((route) => {
        const urlPattern = new URLPattern({ pathname: route.path });
        const isMatch = urlPattern.test(url);
        if (isMatch) {
          pathInfo = urlPattern.exec(url);
        }
        return isMatch;
      });
      const params = pathInfo.pathname.groups;
      const search = {};
      const searchParams = new URLSearchParams(pathInfo.search.groups[0]);
      for (const [key, value] of searchParams.entries()) {
        search[key] = value;
      }
      const htmlTemplate = matchedRoute.render(params, search, url);
      return render(htmlTemplate);
    }
  };

  // main.js
  var router = new Router(
    [
      {
        path: "/",
        render: () => `<html><body><h1>Check 1234s</h1></body></html>`
      },
      {
        path: "/about",
        render: () => `<html><body><h1>About</h1></body></html>`
      }
    ]
  );

  // index.js
  self.addEventListener("install", (event) => {
    event.waitUntil(self.skipWaiting());
    console.log("service worker installed", event);
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      self.clients.claim()
    );
    console.log("service worker activated", event);
  });
  self.addEventListener("fetch", (event) => {
    if (event.request.mode === "navigate") {
      console.log("fetch", event);
      event.respondWith(router.handleRequest(event.request));
    }
  });
})();
//# sourceMappingURL=index.js.map
