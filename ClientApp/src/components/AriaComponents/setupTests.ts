import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';
import { TextDecoder, TextEncoder } from 'util';

configure({ asyncUtilTimeout: 5000 });

type TestHeadersInit = HeadersInit | TestHeaders;

class TestHeaders {
  private readonly headerMap = new Map<string, string>();

  constructor(init?: TestHeadersInit) {
    if (!init) {
      return;
    }

    if (Array.isArray(init)) {
      for (const [key, value] of init) {
        this.set(key, value);
      }
      return;
    }

    if (init instanceof TestHeaders) {
      for (const [key, value] of init.entries()) {
        this.set(key, value);
      }
      return;
    }

    for (const [key, value] of Object.entries(init)) {
      this.set(key, value);
    }
  }

  append(key: string, value: string) {
    this.set(key, value);
  }

  delete(key: string) {
    this.headerMap.delete(key.toLowerCase());
  }

  entries() {
    return this.headerMap.entries();
  }

  forEach(callback: (value: string, key: string, parent: Headers) => void, thisArg?: unknown) {
    for (const [key, value] of this.headerMap.entries()) {
      callback.call(thisArg, value, key, this as unknown as Headers);
    }
  }

  get(key: string) {
    return this.headerMap.get(key.toLowerCase()) ?? null;
  }

  has(key: string) {
    return this.headerMap.has(key.toLowerCase());
  }

  keys() {
    return this.headerMap.keys();
  }

  set(key: string, value: string) {
    this.headerMap.set(key.toLowerCase(), String(value));
  }

  values() {
    return this.headerMap.values();
  }

  [Symbol.iterator]() {
    return this.entries();
  }
}

class TestRequest {
  readonly headers: TestHeaders;
  readonly method: string;
  readonly signal: AbortSignal;
  readonly url: string;

  constructor(input: string | URL | TestRequest, init: RequestInit = {}) {
    this.url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    this.method = init.method ?? (input instanceof TestRequest ? input.method : 'GET');
    this.headers = new TestHeaders(
      init.headers ??
        (input instanceof TestRequest ? Array.from(input.headers.entries()) : undefined)
    );
    this.signal = init.signal ?? new AbortController().signal;
  }

  clone() {
    return new TestRequest(this, {
      headers: Array.from(this.headers.entries()),
      method: this.method,
      signal: this.signal,
    });
  }
}

Object.assign(globalThis, {
  Headers: globalThis.Headers ?? (TestHeaders as unknown as typeof Headers),
  Request: globalThis.Request ?? (TestRequest as unknown as typeof Request),
  TextDecoder,
  TextEncoder,
});
