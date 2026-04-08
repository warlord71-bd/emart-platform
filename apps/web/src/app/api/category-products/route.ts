import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';

const PREFIX = 'wp4h_';

function getDbConfig() {
  try {
    const c = fs.readFileSync('/var/www/wordpress/wp-config.php', 'utf8');
    const get = (k: string) =>
      c.match(new RegExp(`define\\s*\\(\\s*['"]${k}['"]\\s*,\\s*['"]([^'"]+)['"]`))?.[1] ?? '';
    return {
      name: get('DB_NAME') || 'emart_live',
      user: get('DB_USER') || 'emart_user',
      pass: get('DB_PASSWORD') || 'Emart@123456',
      host: get('DB_HOST') || 'localhost',
    };
  } catch {
    return { name: 'emart_live', user: 'emart_user', pass: 'Emart@123456', host: 'localhost' };
  }
}

function mysql(sql: string): string {
  const db = getDbConfig();
  try {
    return execSync(
      `mysql -u ${db.user} -p'${db.pass}' -h ${db.host} ${db.name} -N -B --skip-column-names -e "${sql.replace(/\n/g, ' ').replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim();
  } catch (e: any) {
    const stderr = (e.stderr ?? '').toString();
    const errs = stderr.split('\n').filter((l: string) => l.includes('ERROR') && !l.includes('Warning'));
    if (errs.length) throw new Error(errs.join('\n'));
    return '';
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug  = (searchParams.get('slug') || '').replace(/[^a-z0-9-]/g, '');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 20);

  if (!slug) return NextResponse.json([]);

  try {
    // ── 1. Products for this category ─────────────────────
    const rows = mysql(`
      SELECT
        p.ID, p.post_title, p.post_name,
        MAX(CASE WHEN pm.meta_key='_price'         THEN pm.meta_value END) AS price,
        MAX(CASE WHEN pm.meta_key='_regular_price' THEN pm.meta_value END) AS regular_price,
        MAX(CASE WHEN pm.meta_key='_sale_price'    THEN pm.meta_value END) AS sale_price,
        MAX(CASE WHEN pm.meta_key='_stock_status'  THEN pm.meta_value END) AS stock_status,
        MAX(CASE WHEN pm.meta_key='_thumbnail_id'  THEN pm.meta_value END) AS thumb_id
      FROM ${PREFIX}posts p
      LEFT JOIN ${PREFIX}postmeta pm
        ON p.ID = pm.post_id
        AND pm.meta_key IN ('_price','_regular_price','_sale_price','_stock_status','_thumbnail_id')
      JOIN ${PREFIX}term_relationships tr ON p.ID = tr.object_id
      JOIN ${PREFIX}term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
      JOIN ${PREFIX}terms t ON tt.term_id = t.term_id
      WHERE t.slug = '${slug}'
        AND tt.taxonomy = 'product_cat'
        AND p.post_type = 'product'
        AND p.post_status = 'publish'
      GROUP BY p.ID, p.post_title, p.post_name
      ORDER BY p.ID DESC
      LIMIT ${limit}
    `);

    if (!rows) return NextResponse.json([]);

    const products = rows.split('\n')
      .map(line => {
        const [id, name, postSlug, price, regular_price, sale_price, stock_status, thumb_id] = line.split('\t');
        if (!id || isNaN(parseInt(id))) return null;
        return { id: parseInt(id), name: name || '', slug: postSlug || '', price: price || '',
                 regular_price: regular_price || '', sale_price: sale_price || '',
                 stock_status: stock_status || 'instock', thumb_id: thumb_id || '' };
      })
      .filter(Boolean) as NonNullable<ReturnType<typeof Object.assign>>[];

    // ── 2. Image URLs for all thumb IDs in one query ───────
    const thumbIds = [...new Set(products.map(p => p.thumb_id).filter(Boolean))];
    const imageMap: Record<string, string> = {};
    if (thumbIds.length) {
      const imgRows = mysql(
        `SELECT ID, guid FROM ${PREFIX}posts WHERE ID IN (${thumbIds.join(',')}) AND post_type='attachment'`
      );
      imgRows.split('\n').forEach(line => {
        const [id, url] = line.split('\t');
        if (id && url) imageMap[id.trim()] = url.trim();
      });
    }

    // ── 3. Build WooProduct-compatible objects ─────────────
    const result = products.map(p => {
      const imgUrl = p.thumb_id ? imageMap[p.thumb_id] ?? '' : '';
      const onSale = !!(p.sale_price && p.sale_price !== '' && parseFloat(p.sale_price) > 0);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        regular_price: p.regular_price,
        sale_price: p.sale_price,
        on_sale: onSale,
        stock_status: p.stock_status,
        manage_stock: false,
        stock_quantity: null,
        images: imgUrl ? [{ id: 0, src: imgUrl, alt: p.name }] : [],
        categories: [],
        attributes: [],
        average_rating: '0',
        rating_count: 0,
        short_description: '',
        sku: '',
        permalink: `/${p.slug}`,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[category-products]', err);
    return NextResponse.json([]);
  }
}
