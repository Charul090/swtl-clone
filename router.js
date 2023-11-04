import { render } from './render';

export class Router {
    /**
     * 
     * @param {*} routes Array<{ path: string, render: (params, query, request) => string }>
     */
    constructor(routes) {
        this.routes = routes;
    }

    handleRequest (req) {
        const url = req.url;
        let pathInfo;
        const matchedRoute = this.routes.find(route => {
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
}