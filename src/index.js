(() => {
  var __freeze = Object.freeze;
  var __defProp = Object.defineProperty;
  var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));

  // symbol.js
  var COMPONENT_SYMBOL = Symbol("component");
  var AWAIT_SYMBOL = Symbol("await");

  // html.js
  var TRAVERSAL_MODE = {
    DATA: "DATA",
    COMPONENT: "COMPONENT"
  };
  var LEVEL = {
    PARENT: "PARENT",
    CHILD: "CHILD"
  };
  function getProps(i, j, statics, dynamics) {
    const props = {};
    let property = "";
    let value = "";
    let isValue = false;
    let isKey = false;
    while (statics[i][j] && statics[i][j] !== ">") {
      const isEmptyString = statics[i][j].trim() === "";
      const isEquals = statics[i][j] === "=";
      const isSingleInvertedComma = statics[i][j] === "'";
      const isDoubleInvertedComma = statics[i][j] === '"';
      const isForwardSlash = statics[i][j] === "/";
      const isCurrentCharPeriod = statics[i][j] === ".";
      const isCurrentIndexEndOfStatics = j === statics[i].length - 1;
      const isNextIndexEndOfStatics = j === statics[i].length - 2;
      const isNextCharSingleInvertedComma = statics[i][j + 1] === "'";
      const isNextCharDoubleInvertedComma = statics[i][j + 1] === '"';
      const isDestructuringProps = statics[i].slice(j, j + 4) === "..." && j === statics[i].length - 3;
      if (!isKey && !isValue && isCurrentCharPeriod && isDestructuringProps) {
        Object.keys(dynamics[i]).forEach((propKey) => {
          props[propKey] = dynamics[i][propKey];
        });
        i++;
        j = 0;
      } else if (!isValue && !isKey && !isEmptyString && !isDoubleInvertedComma && !isSingleInvertedComma && !isForwardSlash) {
        isKey = true;
        property += statics[i][j];
      } else if (isKey && !isValue && isEquals && (isCurrentIndexEndOfStatics || isNextIndexEndOfStatics && (isNextCharSingleInvertedComma || isNextCharDoubleInvertedComma)) && dynamics[i] != null) {
        props[property] = dynamics[i];
        property = "";
        isKey = false;
        isValue = false;
        i++;
        j = 0;
        continue;
      } else if (isKey && !isValue && isEquals) {
        isKey = false;
        isValue = true;
        if (isNextCharDoubleInvertedComma || isNextCharSingleInvertedComma) {
          j++;
        }
      } else if (isKey && !isValue && property && (isEmptyString || isForwardSlash)) {
        props[property] = true;
        property = "";
        isKey = false;
      } else if (isKey && !isValue) {
        property += statics[i][j];
      } else if (isValue && !isKey && !isEquals && !isDoubleInvertedComma && !isSingleInvertedComma && !isForwardSlash && !isEmptyString) {
        value += statics[i][j];
      } else if (isValue && !isKey && (isEmptyString || isForwardSlash || isDoubleInvertedComma || isSingleInvertedComma)) {
        props[property] = value;
        property = "";
        value = "";
        isValue = false;
        isKey = false;
      }
      j++;
    }
    if (property) {
      props[property] = value ? value : true;
    }
    const isComponentClosed = statics[i][j - 1] === "/";
    return { props, isComponentClosed, updatedIndexes: [i, j] };
  }
  function* html(statics, ...dynamics) {
    if (dynamics.length === 0) {
      yield* statics;
      return;
    }
    const isComponentPresent = dynamics.some((dynamicValue) => typeof dynamicValue === "function");
    if (!isComponentPresent) {
      yield* statics.reduce((acc, curr, index) => {
        return [...acc, curr, ...dynamics[index] != null ? [dynamics[index]] : []];
      }, []);
      return;
    }
    let currentTraversalMode = TRAVERSAL_MODE.DATA;
    let currentLevel = LEVEL.PARENT;
    let htmlString = "";
    const componentStack = [];
    for (let i = 0; i < statics.length; i++) {
      for (let j = 0; j < statics[i].length; j++) {
        if (currentTraversalMode === TRAVERSAL_MODE.DATA) {
          if (j === statics[i].length - 1 && statics[i][j] === "<") {
            if (htmlString) {
              yield htmlString;
              htmlString = "";
            }
            const component = { fn: dynamics[i], children: [], kind: COMPONENT_SYMBOL };
            ;
            i += 1;
            j = 0;
            const { props, isComponentClosed, updatedIndexes } = getProps(i, j, statics, dynamics);
            [i, j] = updatedIndexes;
            component.props = props;
            if (currentLevel === LEVEL.CHILD) {
              componentStack[componentStack.length - 1].children.push(component);
              if (!isComponentClosed) {
                componentStack.push(component);
              }
            } else if (!isComponentClosed) {
              componentStack.push(component);
              currentLevel = LEVEL.CHILD;
              currentTraversalMode = TRAVERSAL_MODE.COMPONENT;
              if (j === statics[i].length - 1 && dynamics[i] != null) {
                component.children.push(dynamics[i]);
                continue;
              }
            } else {
              yield component;
            }
          } else if (j === statics[i].length - 1 && dynamics[i] != null) {
            yield* [htmlString + statics[i][j], dynamics[i]];
            htmlString = "";
          } else {
            htmlString += statics[i][j];
          }
          if (j === statics[i].length - 1 && dynamics[i] != null) {
            if (htmlString) {
              yield htmlString;
              htmlString = "";
            }
            yield dynamics[i];
          }
        } else if (currentTraversalMode === TRAVERSAL_MODE.COMPONENT) {
          if (j === statics[i].length - 1 && statics[i][j] === "<") {
            if (htmlString) {
              componentStack[componentStack.length - 1].children.push(htmlString);
              htmlString = "";
            }
            const component = { fn: dynamics[i], children: [], kind: COMPONENT_SYMBOL };
            ;
            i += 1;
            j = 0;
            const { props, isComponentClosed, updatedIndexes } = getProps(i, j, statics, dynamics);
            [i, j] = updatedIndexes;
            component.props = props;
            componentStack[componentStack.length - 1].children.push(component);
            if (!isComponentClosed) {
              componentStack.push(component);
            }
            if (j === statics[i].length - 1 && dynamics[i] != null) {
              component.children.push(dynamics[i]);
            }
          } else if (statics[i][j] === "<" && statics[i][j + 1] === "/" && statics[i][j + 2] === "/") {
            const component = componentStack.pop();
            if (htmlString) {
              component.children.push(htmlString);
              htmlString = "";
            }
            if (componentStack.length === 0) {
              yield component;
              currentLevel = LEVEL.PARENT;
              currentTraversalMode = TRAVERSAL_MODE.DATA;
            }
            j += 3;
          } else if (j === statics[i].length - 1 && dynamics[i] != null) {
            componentStack[componentStack.length - 1].children.push(htmlString + statics[i][j], dynamics[i]);
            htmlString = "";
          } else {
            htmlString += statics[i][j];
          }
        }
      }
    }
    if (htmlString) {
      yield htmlString;
    }
  }

  // render.js
  async function getValueFromReadableStream(readableStream) {
    const textDecoder = new TextDecoder();
    let response = "";
    for await (const chunk of readableStream) {
      response += textDecoder.decode(chunk);
    }
    return response;
  }
  async function* serializeChunk(chunk, promiseArray) {
    if (typeof chunk === "string" || typeof chunk === "boolean" || typeof chunk === "number") {
      yield chunk;
    } else if (Array.isArray(chunk)) {
      yield* processTemplate(chunk, promiseArray);
    } else if (chunk?.kind === COMPONENT_SYMBOL && chunk?.fn.kind === AWAIT_SYMBOL) {
      const { promise } = chunk.props;
      const { template } = chunk.fn({ children: chunk.children });
      const id = promiseArray.length;
      promiseArray.push(
        promise().then((data) => {
          return { id, template: template({ success: true, error: false, pending: false }, data, null) };
        }).catch((error) => {
          return { id, template: template({ success: false, error: true, pending: false }, null, error) };
        })
      );
      yield* processTemplate(html`<awaiting-promise style="display:contents" data-id="${String(id)}">${template({ success: false, error: false, pending: true }, null, null)}</awaiting-promise>`, promiseArray);
    } else if (chunk?.kind === COMPONENT_SYMBOL) {
      yield* serializeChunk(chunk.fn({ children: chunk.children, ...chunk.props }), promiseArray);
    } else if (chunk[Symbol.iterator] || chunk[Symbol.asyncIterator]) {
      yield* processTemplate(chunk, promiseArray);
    } else if (String(chunk) === "[object Response]") {
      yield await getValueFromReadableStream(chunk.body);
    } else {
      const stringifiedChunk = chunk.toString();
      yield stringifiedChunk === "[object Object]" ? JSON.stringify(chunk) : stringifiedChunk;
    }
  }
  async function* processTemplate(html2, promiseArray) {
    for await (const chunk of html2) {
      yield* serializeChunk(chunk, promiseArray);
    }
  }
  var _a;
  async function* render(parsedData) {
    const promiseArray = [];
    yield* processTemplate(parsedData, promiseArray);
    while (promiseArray.length > 0) {
      const { id, template } = await Promise.race(promiseArray);
      promiseArray.splice(id, 1);
      yield* render(html(_a || (_a = __template(['\n        <template data-id="', '">', `</template>
        <script>
        {
            const currElem = document.querySelector('awaiting-promise[data-id="`, `"]');
            const newElem = document.querySelector('template[data-id="`, `"]').content.cloneNode(true);
            currElem.replaceWith(newElem);
        }
        <\/script>
        `])), String(id), template, String(id), String(id)));
    }
  }

  // router.js
  async function getHtmlResponseForTemplate(template) {
    const responseIterator = render(template);
    const textEncoder = new TextEncoder();
    const readAbleStream = new ReadableStream({
      pull: async (controller) => {
        const { value, done } = await responseIterator.next();
        if (done) {
          controller.close();
        } else {
          const byteHtml = textEncoder.encode(value);
          controller.enqueue(byteHtml);
        }
      }
    });
    const headers = {
      "Content-Type": "text/html"
    };
    const response = new Response(readAbleStream, { headers });
    return response;
  }
  var Router = class {
    /**
     * 
     * @param {*} routes Array<{ path: string, render: (params, query, request) => string, plugin }>
     * @param {*} fallback string
     * @param {*} baseHref string
     * @param {*} plugins Array<{ name: string, beforeResponse: () => any }>
     */
    constructor({ routes, fallback, baseHref = "", plugin }) {
      this.routes = routes;
      this.fallback = fallback;
      this.plugin = plugin;
      this.baseHref = baseHref;
    }
    async handleRequest(req) {
      const url = req.url;
      let pathInfo;
      const matchedRoute = this.routes.find((route) => {
        const urlPattern = new URLPattern({ pathname: this.baseHref ? this.baseHref + "/" : this.baseHref + route.path });
        const isMatch = urlPattern.test(url);
        if (isMatch) {
          pathInfo = urlPattern.exec(url);
        }
        return isMatch;
      });
      if (!matchedRoute) {
        return await getHtmlResponseForTemplate(this.fallback || "");
      }
      const search = {};
      const searchParams = new URLSearchParams(pathInfo.search.groups[0]);
      const params = pathInfo.pathname.groups;
      if (matchedRoute.plugin ?? this.plugin) {
        const plugins = matchedRoute.plugin ?? this.plugin;
        for (const plugin of plugins) {
          const pluginRes2 = await plugin.beforeResponse(params, search, req);
          if (String(pluginRes2) === "[object Response]") {
            return pluginRes2;
          }
        }
        ;
        return await getHtmlResponseForTemplate(pluginRes);
      }
      for (const [key, value] of searchParams.entries()) {
        search[key] = value;
      }
      const htmlTemplate = matchedRoute.render(params, search, req);
      return await getHtmlResponseForTemplate(htmlTemplate);
    }
  };

  // HtmlPage/index.js
  var _a2;
  function HtmlPage({ children, title }) {
    return html(_a2 || (_a2 = __template(['\n    <html lang="en">\n      <head>\n        <meta charset="utf-8" />\n        <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n        <meta name="Description" content="">\n        <title>', '</title>\n      </head>\n      <body>\n        <ul>\n          <li><a href="/">home</a></li>\n          <li><a href="/a">a</a></li>\n          <li><a href="/b">b</a></li>\n        </ul>\n        ', "\n        <script>\n          let refreshing;\n          async function handleUpdate() {\n            // check to see if there is a current active service worker\n            const oldSw = (await navigator.serviceWorker.getRegistration())?.active?.state;\n\n            navigator.serviceWorker.addEventListener('controllerchange', async () => {\n              if (refreshing) return;\n\n              // when the controllerchange event has fired, we get the new service worker\n              const newSw = (await navigator.serviceWorker.getRegistration())?.active?.state;\n\n              // if there was already an old activated service worker, and a new activating service worker, do the reload\n              if (oldSw === 'activated' && newSw === 'activating') {\n                refreshing = true;\n                window.location.reload();\n              }\n            });\n          }\n\n          handleUpdate();\n        <\/script>\n      </body>\n    </html>\n  "])), title ?? "", children);
  }

  // await.js
  function Await({ children }) {
    const template = children.find((element) => typeof element === "function");
    return {
      template
    };
  }
  Await.kind = AWAIT_SYMBOL;
  var when = (condition, template) => {
    return condition ? template() : "";
  };

  // main.js
  var router = new Router(
    {
      routes: [
        {
          path: "/a",
          render: () => `<html><body><h1>About</h1></body></html>`
        },
        {
          path: "/b",
          plugin: [{ name: "b plugin", beforeResponse: async () => {
            const textEncoder = new TextEncoder();
            return new Response(textEncoder.encode(`<html><body><h1>Render Local</h1></body></html>`));
          } }]
        },
        {
          path: "/",
          render: ({ params, query, request }) => html`
                  <${HtmlPage}>
                    <h1>home</h1>
                    <ul>
                      <li>
                        <${Await} promise=${() => new Promise((r) => setTimeout(() => r({ foo: "foo" }), 3e3))}>
                          ${({ pending, success }, data) => html`
                            ${when(pending, () => html`[PENDING] slow`)}
                            ${when(success, () => html`[RESOLVED] slow ${data.foo}`)}
                          `}
                        <//>
                      </li> 
                      <li>
                        <${Await} promise=${() => new Promise((r) => setTimeout(() => r({ bar: "bar" }), 1500))}>
                          ${({ pending, success }, data) => html`
                            ${when(pending, () => html`[PENDING] fast`)}
                            ${when(success, () => html`[RESOLVED] fast ${data.bar}`)}
                          `}
                        <//>
                      </li>
                    </ul>
                    <h2>footer</h2>
                  <//>
                `
        }
      ],
      fallback: `<html><body><h1>404</h1></body></html>`
      // plugin: () =>('<html><body><h1>Render global plugin</h1></body></html>')
    }
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
