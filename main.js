import { Router } from './router';
import { render } from './render';
import { HtmlPage } from './HtmlPage/index';
import { html } from './html';
import { Await, when } from './await';

export const router = new Router(
    {
        routes: [
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
            },
            {
                path: '/',
                render: ({params, query, request}) => html`
                  <${HtmlPage}>
                    <h1>home</h1>
                    <ul>
                      <li>
                        <${Await} promise=${() => new Promise(r => setTimeout(() => r({foo:'foo'}), 3000))}>
                          ${({ pending, success }, data) => html`
                            ${when(pending, () => html`[PENDING] slow`)}
                            ${when(success, () => html`[RESOLVED] slow ${data.foo}`)}
                          `}
                        <//>
                      </li> 
                      <li>
                        <${Await} promise=${() => new Promise(r => setTimeout(() => r({bar:'bar'}), 1500))}>
                          ${({pending, success}, data) => html`
                            ${when(pending, () => html`[PENDING] fast`)}
                            ${when(success, () => html`[RESOLVED] fast ${data.bar}`)}
                          `}
                        <//>
                      </li>
                    </ul>
                    <h2>footer</h2>
                  <//>
                `
              },
        ],
        fallback: `<html><body><h1>404</h1></body></html>`,
        // plugin: () =>('<html><body><h1>Render global plugin</h1></body></html>')
    }
);