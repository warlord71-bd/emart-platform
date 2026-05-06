export function rewriteInternalLinks(html: string): string {
  if (!html) return '';

  return html
    .replace(
      /(href=["'])https?:\/\/(?:www\.)?e-mart\.com\.bd\/product\//gi,
      '$1https://e-mart.com.bd/shop/'
    )
    .replace(/(href=["'])\/product\//gi, '$1/shop/')
    .replace(
      /(href=["'])https?:\/\/(?:www\.)?e-mart\.com\.bd\/product-category\//gi,
      '$1https://e-mart.com.bd/category/'
    )
    .replace(/(href=["'])\/product-category\//gi, '$1/category/');
}
