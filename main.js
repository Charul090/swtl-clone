import { Router } from './router';

export const router = new Router(
    [
        {
            path: '/',
            render: () => (`<html><body><h1>Check 1234</h1></body></html>`)
        },
        {
            path: '/about',
            render: () => (`<html><body><h1>About</h1></body></html>`)
        }
    ]
);