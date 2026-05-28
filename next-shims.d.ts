declare module 'next' {
  export interface Metadata {
    [key: string]: unknown;
  }

  export type NextConfig = Record<string, unknown>;
}

declare module 'next/headers' {
  export function cookies(): Promise<{
    get(name: string): { name: string; value: string } | undefined;
  }>;
}

declare module 'next/navigation' {
  export function redirect(url: string): never;
}

declare module 'next/image' {
  import type * as React from 'react';

  export type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  };

  const Image: React.ComponentType<ImageProps>;
  export default Image;
}

declare module 'next/server' {
  export class NextRequest extends Request {
    cookies: {
      get(name: string): { name: string; value: string } | undefined;
    };
    nextUrl: URL & {
      pathname: string;
      search: string;
      searchParams: URLSearchParams;
    };
  }

  export class NextResponse extends Response {
    static next(): NextResponse;
    static redirect(url: string | URL, init?: number | ResponseInit): NextResponse;
    static json(body: unknown, init?: ResponseInit): NextResponse;
    cookies: {
      set(name: string, value: string, options?: Record<string, unknown>): void;
      get(name: string): { name: string; value: string } | undefined;
    };
  }
}

declare module 'next/server.js' {
  export * from 'next/server';
}

declare module 'next/types.js' {
  export interface ResolvingMetadata {
    [key: string]: unknown;
  }

  export interface ResolvingViewport {
    [key: string]: unknown;
  }
}
