export * from './guards.js';

export function wrapUntrusted(tag: string, content: string): string {
  // Sanitize content against closing tags to avoid injection escapes
  const sanitized = content.replace(new RegExp(`</${tag}>`, 'gi'), `[ESCAPED_/${tag}]`);
  return `<untrusted_${tag}>\n${sanitized}\n</untrusted_${tag}>`;
}
