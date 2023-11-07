import { Router } from './router';
import { render } from './render';

export const router = new Router(
    {
        routes: [
            {
                path: '/',
                render: () => (`<html><body><h1>Check 1234s</h1></body></html>`)
            },
            {
                path: '/about',
                render: () => (`<html><body><h1>About</h1></body></html>`)
            },
            {
                path: '/local',
                plugin: () => (`<html><body><h1>Render Local</h1></body></html>`)
            },
            {
                path: '/stream',
                plugin: () => (render(`<html><body><h1>Render Stream</h1></body></html>`))
            }
        ],
        fallback: `<html><body><h1>404</h1></body></html>`,
        plugin: () =>('<html><body><h1>Render global plugin</h1></body></html>')
    }
);