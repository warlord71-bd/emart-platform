// Server-only MySQL helper (uses local mysql CLI — no REST API)
import { execSync } from 'child_process';
import fs from 'fs';

const PREFIX = 'wp4h_';

function getDbConfig() {
  try {
    const c = fs.readFileSync('/var/www/wordpress/wp-config.php', 'utf8');
    const get = (k: string) =>
      c.match(new RegExp(`define\\s*\\(\\s*['"]${k}['"]\\s*,\\s*['"]([^'"]+)['"]`))?.[1] ?? '';
    return { name: get('DB_NAME') || 'emart_live', user: get('DB_USER') || 'emart_user',
             pass: get('DB_PASSWORD') || 'Emart@123456', host: get('DB_HOST') || 'localhost' };
  } catch {
    return { name: 'emart_live', user: 'emart_user', pass: 'Emart@123456', host: 'localhost' };
  }
}

export function mysql(sql: string): string {
  const db = getDbConfig();
  try {
    return execSync(
      `mysql -u ${db.user} -p'${db.pass}' -h ${db.host} ${db.name} -N -B --skip-column-names -e "${sql.replace(/\n/g,' ').replace(/"/g,'\\"')}"`,
      { encoding: 'utf8', timeout: 15000, stdio: ['pipe','pipe','pipe'] }
    ).trim();
  } catch (e: any) {
    const stderr = (e.stderr ?? '').toString();
    const errs = stderr.split('\n').filter((l: string) => l.includes('ERROR') && !l.includes('Warning'));
    if (errs.length) throw new Error(errs.join('\n'));
    return '';
  }
}

export interface DbProduct {
  id: number; name: string; slug: string;
  price: string; regular_price: string; sale_price: string;
  on_sale: boolean; stock_status: string;
  images: { id: number; src: string; alt: string }[];
  categories: { id: number; name: string; slug: string }[];
  attributes: []; average_rating: string; rating_count: number;
  short_description: string; sku: string; permalink: string;
}

export async function getProductsByCategory(
  categorySlug: string, page = 1, perPage = 20, orderby = 'date', order = 'desc'
): Promise<{ products: DbProduct[]; total: number }> {
  const sanitized = categorySlug.replace(/[^a-z0-9-]/g, '');
  const offset = (page - 1) * perPage;

  const orderCol = orderby === 'date' ? 'p.post_date'
    : orderby === 'title' ? 'p.post_title'
    : orderby === 'price' ? 'CAST(price_meta.meta_value AS DECIMAL)'
    : 'p.post_date';
  const dir = order === 'asc' ? 'ASC' : 'DESC';

  const rows = mysql(`
    SELECT p.ID, p.post_title, p.post_name,
      MAX(CASE WHEN pm.meta_key='_price'         THEN pm.meta_value END) AS price,
      MAX(CASE WHEN pm.meta_key='_regular_price' THEN pm.meta_value END) AS regular_price,
      MAX(CASE WHEN pm.meta_key='_sale_price'    THEN pm.meta_value END) AS sale_price,
      MAX(CASE WHEN pm.meta_key='_stock_status'  THEN pm.meta_value END) AS stock_status,
      MAX(CASE WHEN pm.meta_key='_thumbnail_id'  THEN pm.meta_value END) AS thumb_id,
      MAX(CASE WHEN pm.meta_key='_sku'           THEN pm.meta_value END) AS sku
    FROM ${PREFIX}posts p
    LEFT JOIN ${PREFIX}postmeta pm ON p.ID=pm.post_id
      AND pm.meta_key IN ('_price','_regular_price','_sale_price','_stock_status','_thumbnail_id','_sku')
    JOIN ${PREFIX}term_relationships tr ON p.ID=tr.object_id
    JOIN ${PREFIX}term_taxonomy tt ON tr.term_taxonomy_id=tt.term_taxonomy_id
    JOIN ${PREFIX}terms t ON tt.term_id=t.term_id
    WHERE t.slug='${sanitized}' AND tt.taxonomy='product_cat'
      AND p.post_type='product' AND p.post_status='publish'
    GROUP BY p.ID, p.post_title, p.post_name, p.post_date
    ORDER BY ${orderCol} ${dir}
    LIMIT ${perPage} OFFSET ${offset}
  `);

  const countRow = mysql(`
    SELECT COUNT(DISTINCT p.ID)
    FROM ${PREFIX}posts p
    JOIN ${PREFIX}term_relationships tr ON p.ID=tr.object_id
    JOIN ${PREFIX}term_taxonomy tt ON tr.term_taxonomy_id=tt.term_taxonomy_id
    JOIN ${PREFIX}terms t ON tt.term_id=t.term_id
    WHERE t.slug='${sanitized}' AND tt.taxonomy='product_cat'
      AND p.post_type='product' AND p.post_status='publish'
  `);
  const total = parseInt(countRow) || 0;

  if (!rows) return { products: [], total };

  const raw = rows.split('\n').map(line => {
    const [id, name, slug, price, regular_price, sale_price, stock_status, thumb_id, sku] = line.split('\t');
    if (!id || isNaN(parseInt(id))) return null;
    return { id: parseInt(id), name: name||'', slug: slug||'', price: price||'',
             regular_price: regular_price||'', sale_price: sale_price||'',
             stock_status: stock_status||'instock', thumb_id: thumb_id||'', sku: sku||'' };
  }).filter(Boolean) as NonNullable<{id:number;name:string;slug:string;price:string;regular_price:string;sale_price:string;stock_status:string;thumb_id:string;sku:string}>[];

  // Resolve image URLs
  const thumbIds = [...new Set(raw.map(p => p.thumb_id).filter(Boolean))];
  const imageMap: Record<string, string> = {};
  if (thumbIds.length) {
    const imgRows = mysql(`SELECT ID, guid FROM ${PREFIX}posts WHERE ID IN (${thumbIds.join(',')}) AND post_type='attachment'`);
    imgRows.split('\n').forEach(line => {
      const [id, url] = line.split('\t');
      if (id && url) imageMap[id.trim()] = url.trim();
    });
  }

  const products: DbProduct[] = raw.map(p => ({
    id: p.id, name: p.name, slug: p.slug, price: p.price,
    regular_price: p.regular_price, sale_price: p.sale_price,
    on_sale: !!(p.sale_price && parseFloat(p.sale_price) > 0),
    stock_status: p.stock_status, sku: p.sku,
    images: p.thumb_id && imageMap[p.thumb_id] ? [{ id: 0, src: imageMap[p.thumb_id], alt: p.name }] : [],
    categories: [], attributes: [], average_rating: '0', rating_count: 0,
    short_description: '', permalink: `/${p.slug}`,
  }));

  return { products, total };
}

export async function getCategoryInfo(slug: string): Promise<{ id: number; name: string; slug: string; count: number } | null> {
  const sanitized = slug.replace(/[^a-z0-9-]/g, '');
  const row = mysql(`
    SELECT t.term_id, t.name, t.slug, tt.count
    FROM ${PREFIX}terms t
    JOIN ${PREFIX}term_taxonomy tt ON t.term_id=tt.term_id
    WHERE t.slug='${sanitized}' AND tt.taxonomy='product_cat'
    LIMIT 1
  `);
  if (!row) return null;
  const [id, name, termSlug, count] = row.split('\t');
  return { id: parseInt(id), name: name||'', slug: termSlug||'', count: parseInt(count)||0 };
}
