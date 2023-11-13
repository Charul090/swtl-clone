import { Router } from './router';
import { render } from './render';
import { HtmlPage } from './HtmlPage/index';
import { html } from './html';

export const router = new Router(
    {
        routes: [
            {
                path: '/',
                render: ({params, query, request}) => html`<${HtmlPage}><h1>Foo</h1><//>`
            },
            {
                path: '/a',
                render: () => (`<html><body><h1>About</h1></body></html>`)
            },
            {
                path: '/b',
                plugin: [{ name: 'b plugin', beforeResponse: async () =>  {
                    const textEncoder = new TextEncoder();
                    return new Response(textEncoder.encode(`<html><body><h1>Render Local</h1></body></html>`));
                }}]
            }
        ],
        fallback: `<html><body><h1>404</h1></body></html>`,
        // plugin: () =>('<html><body><h1>Render global plugin</h1></body></html>')
    }
);