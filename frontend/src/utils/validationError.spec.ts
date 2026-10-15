import { expect, it } from 'vitest';
import { validationErrorMessage } from './validationError';

it('shows validation locations and reasons without echoing submitted data', () => {
  expect(validationErrorMessage({ response: { status: 422, data: { detail: [
    { loc: ['body', 'titulo_sugerido'], msg: 'String should have at least 5 characters', input: 'private text' },
    { loc: ['body', 'metadados_estruturados', 'elementos_cenario', 0], msg: 'String should have at most 500 characters' },
  ] } } })).toBe('titulo_sugerido: String should have at least 5 characters; metadados_estruturados.elementos_cenario.0: String should have at most 500 characters');
});

it('accepts a plain validation reason', () => {
  expect(validationErrorMessage({ response: { status: 422, data: { detail: 'Invalid video metadata' } } })).toBe('Invalid video metadata');
});

it.each([null, undefined, new Error('failed'), { response: { status: 500 } }, { response: { status: 422, data: { detail: [null, 5, {}] } } }])('falls back for other or malformed errors', (error) => {
  expect(validationErrorMessage(error)).toBeNull();
});
