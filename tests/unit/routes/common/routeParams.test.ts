import { getValidApplicationId, getValidPositiveIntegerId } from '../../../../ClientApp/src/routes/common/routeParams';

describe('route param validation', () => {
    it.each(['abc123', 'REQ-2026-0001', '550e8400-e29b-41d4-a716-446655440000', '12345'])(
        'accepts application id %s',
        (id) => {
            expect(getValidApplicationId(id)).toBe(id);
        },
    );

    it.each([undefined, '', ' ', '../admin', 'abc/123', 'abc?x=1', 'javascript:alert(1)', '%2Fadmin'])(
        'rejects unsafe application id %s',
        (id) => {
            expect(getValidApplicationId(id)).toBeNull();
        },
    );

    it.each([
        ['1', 1],
        ['42', 42],
        ['9007199254740991', 9007199254740991],
    ])('accepts positive integer id %s', (id, expected) => {
        expect(getValidPositiveIntegerId(id)).toBe(expected);
    });

    it.each([undefined, '', '0', '-1', '1.5', 'abc', '1e3', '01', '1/2', '9007199254740992'])(
        'rejects invalid positive integer id %s',
        (id) => {
            expect(getValidPositiveIntegerId(id)).toBeNull();
        },
    );
});
