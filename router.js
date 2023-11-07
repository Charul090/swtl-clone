import { render } from './render';

export class Router {
    /**
     * 
     * @param {*} routes Array<{ path: string, render: (params, query, request) => string, plugin }>
     * @param {*} fallback string
     * @param {*} baseHref string
     * @param {*} baseHref plugins
     */
    constructor({ routes, fallback, baseHref = '', plugin }) {
        this.routes = routes;
        this.fallback = fallback;
        this.plugin = plugin;
        this.baseHref = baseHref
    }

    handleRequest (req) {
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
            return render(this.fallback || '');
        }

        const search = {};
        const searchParams = new URLSearchParams(pathInfo.search.groups[0]);
        const params = pathInfo.pathname.groups;
        
        if (matchedRoute.plugin ?? this.plugin) {
            const plugin = matchedRoute.plugin ?? this.plugin;
            const pluginRes = plugin(params, search, req);
            if (String(pluginRes) === '[object Response]') {
                return pluginRes;
            }
            
            return render(pluginRes);
        }
        
        
        for (const [key, value] of searchParams.entries()) {
            search[key] = value;
        }

        const htmlTemplate = matchedRoute.render(params, search, req);
        return render(htmlTemplate);
    }
}