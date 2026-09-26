export function resolveGuideLink(href: string | undefined, slug: string[]): string | undefined {
  if (!href?.match(/^(?:\.{1,2}\/)+[^?#]*\.md(?:#.*)?$/)) return href;

  const url = new URL(href, `https://guide.invalid/guide/${slug.join('/')}.md`);
  if (!url.pathname.startsWith('/guide/')) return href;

  const fragment = href.includes('#') ? href.slice(href.indexOf('#')) : '';
  return `${url.pathname.replace(/\.md$/, '')}${fragment}`;
}
