export * from './guards.js';
export * from './provider.js';
export * from './mock.js';

export function wrapUntrusted(tag: string, content: string): string {
  const sanitized = content.replace(new RegExp(`</untrusted_${tag}>`, 'gi'), `[ESCAPED]`);
  return `<untrusted_${tag}>\n${sanitized}\n</untrusted_${tag}>`;
}
