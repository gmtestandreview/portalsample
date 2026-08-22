import { http, HttpResponse } from 'msw';

export const mswHandlers = [
    http.get('/api/dashboard/*', () =>
        HttpResponse.json({
            items: [],
            currentPage: 1,
            totalPages: 0,
            totalCount: 0,
        })
    ),
];
