import { render } from './render';

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
        'Content-Type': 'text/html'
    };
    const response = new Response(readAbleStream, { headers });
    return response;
};
export class Router {
    /**
     * 
     * @param {*} routes Array<{ path: string, render: (params, query, request) => string, plugin }>
     * @param {*} fallback string
     * @param {*} baseHref string
     * @param {*} plugins Array<{ name: string, beforeResponse: () => any }>
     */
    constructor({ routes, fallback, baseHref = '', plugin }) {
        this.routes = routes;
        this.fallback = fallback;
        this.plugin = plugin;
        this.baseHref = baseHref
    }

    async handleRequest (req) {
        const url = req.url;
        let pathInfo;
        const matchedRoute = this.routes.find(route => {
            const urlPattern = new URLPattern({ pathname: this.baseHref ? this.baseHref + '/' : this.baseHref + route.path });
            const isMatch = urlPattern.test(url);
            if (isMatch) {
                pathInfo = urlPattern.exec(url);
            }

            return isMatch;
        });

        if (!matchedRoute) {
            return await getHtmlResponseForTemplate(this.fallback || '');
        }

        const search = {};
        const searchParams = new URLSearchParams(pathInfo.search.groups[0]);
        const params = pathInfo.pathname.groups;
        
        if (matchedRoute.plugin ?? this.plugin) {
            const plugins = matchedRoute.plugin ?? this.plugin;
            for(const plugin of plugins) {
                const pluginRes = await plugin.beforeResponse(params, search, req);
                if (String(pluginRes) === '[object Response]') {
                    return pluginRes;
                }
            };
            
            return await getHtmlResponseForTemplate(pluginRes);
        }
        
        
        for (const [key, value] of searchParams.entries()) {
            search[key] = value;
        }

        const htmlTemplate = matchedRoute.render(params, search, req);
        return await getHtmlResponseForTemplate(htmlTemplate);
    }
}
