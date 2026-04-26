const WORDPRESS_URL = process.env.NEXT_PUBLIC_WOO_URL || '';
const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://e-mart.com.bd';
const CONFIGURED_GRAPHQL_URL =
  process.env.WORDPRESS_GRAPHQL_URL ||
  process.env.WP_GRAPHQL_URL ||
  process.env.NEXT_PUBLIC_WORDPRESS_GRAPHQL_URL ||
  '';
const INFERRED_GRAPHQL_URL = shouldInferGraphQLEndpoint(WORDPRESS_URL, PUBLIC_SITE_URL)
  ? `${WORDPRESS_URL.replace(/\/$/, '')}/graphql`
  : '';
const GRAPHQL_URL =
  CONFIGURED_GRAPHQL_URL ||
  INFERRED_GRAPHQL_URL;

const GRAPHQL_TIMEOUT_MS = Number(process.env.WORDPRESS_GRAPHQL_TIMEOUT_MS || 12000);
const GRAPHQL_PAGE_SIZE = Number(process.env.WORDPRESS_GRAPHQL_PAGE_SIZE || 1000);
const GRAPHQL_SITEMAP_PAGE_SIZE = Number(
  process.env.WORDPRESS_GRAPHQL_SITEMAP_PAGE_SIZE ||
  process.env.WORDPRESS_GRAPHQL_PAGE_SIZE ||
  1000
);
const GRAPHQL_SITEMAP_LIMIT = Number(process.env.WORDPRESS_GRAPHQL_SITEMAP_LIMIT || 20000);
const MAX_GRAPHQL_PAGES = 100;
const MAX_EMART_SITEMAP_PAGES = 50;

export interface GraphQLSitemapImage {
  src: string;
  name: string;
  alt: string;
}

export interface GraphQLSitemapProduct {
  name: string;
  slug: string;
  date_modified?: string;
  images: GraphQLSitemapImage[];
  categorySlugs: string[];
}

export interface GraphQLSitemapCategory {
  name: string;
  slug: string;
  count?: number;
  date_modified?: string;
}

export interface GraphQLProductMetadata {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  image?: GraphQLSitemapImage;
}

export interface GraphQLCategoryMetadata {
  name: string;
  slug: string;
  description: string;
}

export function isWordPressGraphQLConfigured(): boolean {
  return Boolean(GRAPHQL_URL);
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}

type ConnectionData<TNode> = Record<string, { pageInfo?: PageInfo; nodes?: TNode[] } | null | undefined>;

interface PageInfo {
  hasNextPage?: boolean;
  endCursor?: string | null;
}

interface ProductConnection {
  pageInfo?: PageInfo;
  nodes?: GraphQLProductNode[];
}

interface ProductCategoryConnection {
  pageInfo?: PageInfo;
  nodes?: GraphQLCategoryNode[];
}

interface GraphQLProductNode {
  name?: string | null;
  slug?: string | null;
  date?: string | null;
  dateGmt?: string | null;
  modified?: string | null;
  modifiedGmt?: string | null;
  image?: GraphQLImageNode | null;
  galleryImages?: {
    nodes?: GraphQLImageNode[];
  } | null;
  productCategories?: {
    nodes?: GraphQLCategoryNode[];
  } | null;
  description?: string | null;
  shortDescription?: string | null;
}

interface GraphQLCategoryNode {
  name?: string | null;
  slug?: string | null;
  count?: number | null;
  description?: string | null;
}

interface GraphQLImageNode {
  sourceUrl?: string | null;
  altText?: string | null;
  title?: string | null;
}

interface EmartSitemapData {
  emartSitemapProducts?: EmartSitemapProductNode[] | null;
  emartSitemapCategories?: EmartSitemapCategoryNode[] | null;
}

interface EmartSitemapProductNode {
  name?: string | null;
  slug?: string | null;
  modifiedGmt?: string | null;
  image?: EmartSitemapImageNode | null;
  categorySlugs?: Array<string | null> | null;
}

interface EmartSitemapCategoryNode {
  name?: string | null;
  slug?: string | null;
  count?: number | null;
  modifiedGmt?: string | null;
}

interface EmartSitemapImageNode {
  src?: string | null;
  title?: string | null;
  alt?: string | null;
}

const EMART_SITEMAP_PRODUCTS_QUERY = `
  query EmartSitemapProducts($limit: Int!, $offset: Int!) {
    emartSitemapProducts(limit: $limit, offset: $offset) {
      name
      slug
      modifiedGmt
      image {
        src
        title
        alt
      }
      categorySlugs
    }
  }
`;

const EMART_SITEMAP_CATEGORIES_QUERY = `
  query EmartSitemapCategories {
    emartSitemapCategories {
      name
      slug
      count
      modifiedGmt
    }
  }
`;

const SITEMAP_PRODUCTS_QUERY = `
  query SitemapProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        name
        slug
        date
        dateGmt
        modified
        modifiedGmt
        image {
          sourceUrl
          altText
          title
        }
        productCategories(first: 20) {
          nodes {
            name
            slug
            count
          }
        }
      }
    }
  }
`;

const SITEMAP_CATEGORIES_QUERY = `
  query SitemapCategories($first: Int!, $after: String) {
    productCategories(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        name
        slug
        count
      }
    }
  }
`;

const PRODUCT_METADATA_QUERY = `
  query ProductMetadata($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      name
      slug
      description
      shortDescription
      image {
        sourceUrl
        altText
        title
      }
    }
  }
`;

const CATEGORY_METADATA_QUERY = `
  query CategoryMetadata($slug: ID!) {
    productCategory(id: $slug, idType: SLUG) {
      name
      slug
      description
    }
  }
`;

export async function getGraphQLSitemapData(): Promise<{
  products: GraphQLSitemapProduct[];
  categories: GraphQLSitemapCategory[];
}> {
  try {
    const data = await getEmartGraphQLSitemapData();
    if (data.products.length > 0) {
      return data;
    }

    console.warn('Custom GraphQL sitemap returned no products. Falling back to WooGraphQL.');
  } catch (error) {
    console.warn('Custom GraphQL sitemap failed. Falling back to WooGraphQL.', getErrorMessage(error));
  }

  const [products, categories] = await Promise.all([
    getGraphQLSitemapProducts(),
    getGraphQLSitemapCategories(),
  ]);

  const categoryLastmodBySlug = getCategoryLastmodBySlug(products);

  return {
    products,
    categories: categories.map((category) => ({
      ...category,
      date_modified: category.date_modified || categoryLastmodBySlug.get(category.slug),
    })),
  };
}

export async function getGraphQLProductMetadata(slug: string): Promise<GraphQLProductMetadata | null> {
  const data = await graphqlRequest<{ product?: GraphQLProductNode | null }>(
    PRODUCT_METADATA_QUERY,
    { slug }
  );

  const product = data.product;
  if (!product?.slug || !product.name) return null;

  return {
    name: product.name,
    slug: product.slug,
    description: stripHtml(product.description || ''),
    short_description: stripHtml(product.shortDescription || ''),
    image: mapImage(product.image),
  };
}

export async function getGraphQLCategoryMetadata(slug: string): Promise<GraphQLCategoryMetadata | null> {
  const data = await graphqlRequest<{ productCategory?: GraphQLCategoryNode | null }>(
    CATEGORY_METADATA_QUERY,
    { slug }
  );

  const category = data.productCategory;
  if (!category?.slug || !category.name) return null;

  return {
    name: category.name,
    slug: category.slug,
    description: stripHtml(category.description || ''),
  };
}

async function getGraphQLSitemapProducts(): Promise<GraphQLSitemapProduct[]> {
  const nodes = await fetchPaginatedConnection<GraphQLProductNode>(
    SITEMAP_PRODUCTS_QUERY,
    'products'
  );

  return nodes
    .map(mapProduct)
    .filter((product): product is GraphQLSitemapProduct => Boolean(product));
}

async function getGraphQLSitemapCategories(): Promise<GraphQLSitemapCategory[]> {
  const nodes = await fetchPaginatedConnection<GraphQLCategoryNode>(
    SITEMAP_CATEGORIES_QUERY,
    'productCategories'
  );

  return nodes
    .map(mapCategory)
    .filter((category): category is GraphQLSitemapCategory => Boolean(category));
}

async function getEmartGraphQLSitemapData(): Promise<{
  products: GraphQLSitemapProduct[];
  categories: GraphQLSitemapCategory[];
}> {
  const productNodes: EmartSitemapProductNode[] = [];
  const pageSize = getSitemapPageSize();
  const maxItems = getSitemapLimit();
  let offset = 0;
  let page = 0;
  let hasMoreProducts = true;

  const [firstProductPage, categoryNodes] = await Promise.all([
    getEmartSitemapProductNodes(pageSize, offset),
    getEmartSitemapCategoryNodes(),
  ]);
  productNodes.push(...firstProductPage);
  offset += pageSize;
  page += 1;
  hasMoreProducts = firstProductPage.length === pageSize;

  while (
    hasMoreProducts &&
    productNodes.length < maxItems &&
    page < MAX_EMART_SITEMAP_PAGES
  ) {
    const currentPageSize = Math.min(pageSize, maxItems - productNodes.length);
    const pageNodes = await getEmartSitemapProductNodes(currentPageSize, offset);
    productNodes.push(...pageNodes);
    offset += pageSize;
    page += 1;
    hasMoreProducts = pageNodes.length === currentPageSize;
  }

  return {
    products: productNodes
      .map(mapEmartSitemapProduct)
      .filter((product): product is GraphQLSitemapProduct => Boolean(product)),
    categories: categoryNodes
      .map(mapEmartSitemapCategory)
      .filter((category): category is GraphQLSitemapCategory => Boolean(category)),
  };
}

async function getEmartSitemapProductNodes(
  limit: number,
  offset: number
): Promise<EmartSitemapProductNode[]> {
  const data = await graphqlRequest<EmartSitemapData>(
    EMART_SITEMAP_PRODUCTS_QUERY,
    { limit, offset }
  );

  if (!Array.isArray(data.emartSitemapProducts)) {
    throw new Error('Custom GraphQL sitemap products were not returned.');
  }

  return data.emartSitemapProducts;
}

async function getEmartSitemapCategoryNodes(): Promise<EmartSitemapCategoryNode[]> {
  const data = await graphqlRequest<EmartSitemapData>(
    EMART_SITEMAP_CATEGORIES_QUERY,
    {}
  );

  if (!Array.isArray(data.emartSitemapCategories)) {
    throw new Error('Custom GraphQL sitemap categories were not returned.');
  }

  return data.emartSitemapCategories;
}

async function fetchPaginatedConnection<TNode>(query: string, connectionKey: string): Promise<TNode[]> {
  const nodes: TNode[] = [];
  let after: string | null = null;

  for (let page = 0; page < MAX_GRAPHQL_PAGES; page += 1) {
    const data: ConnectionData<TNode> = await graphqlRequest<ConnectionData<TNode>>(query, {
      first: GRAPHQL_PAGE_SIZE,
      after,
    });
    const connection: ConnectionData<TNode>[string] = data[connectionKey];

    if (!connection || !Array.isArray(connection.nodes)) {
      throw new Error(`GraphQL connection "${connectionKey}" was not returned.`);
    }

    nodes.push(...connection.nodes);

    if (!connection.pageInfo?.hasNextPage) break;
    after = connection.pageInfo.endCursor || null;
    if (!after) break;
  }

  return nodes;
}

async function graphqlRequest<TData>(
  query: string,
  variables: Record<string, unknown>
): Promise<TData> {
  if (!GRAPHQL_URL) {
    throw new Error('WORDPRESS_GRAPHQL_URL is not configured.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GRAPHQL_TIMEOUT_MS);

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed with HTTP ${response.status}.`);
    }

    const payload = (await response.json()) as GraphQLResponse<TData>;
    if (payload.errors?.length) {
      const message = payload.errors
        .map((error) => error.message)
        .filter(Boolean)
        .slice(0, 3)
        .join('; ');
      throw new Error(`GraphQL returned errors: ${message || 'unknown error'}.`);
    }

    if (!payload.data) {
      throw new Error('GraphQL response did not include data.');
    }

    return payload.data;
  } finally {
    clearTimeout(timeout);
  }
}

function mapProduct(product: GraphQLProductNode): GraphQLSitemapProduct | null {
  if (!product.slug || !product.name) return null;

  const images = [product.image]
    .map(mapImage)
    .filter((image): image is GraphQLSitemapImage => Boolean(image));

  return {
    name: product.name,
    slug: product.slug,
    date_modified: firstString(product.modifiedGmt, product.modified, product.dateGmt, product.date),
    images: dedupeImages(images),
    categorySlugs: (product.productCategories?.nodes || [])
      .map((category) => category.slug)
      .filter((slug): slug is string => Boolean(slug)),
  };
}

function mapCategory(category: GraphQLCategoryNode): GraphQLSitemapCategory | null {
  if (!category.slug || !category.name) return null;

  return {
    name: category.name,
    slug: category.slug,
    count: typeof category.count === 'number' ? category.count : undefined,
  };
}

function mapEmartSitemapProduct(product: EmartSitemapProductNode): GraphQLSitemapProduct | null {
  if (!product.slug || !product.name) return null;

  return {
    name: product.name,
    slug: product.slug,
    date_modified: product.modifiedGmt || undefined,
    images: dedupeImages(
      [mapEmartSitemapImage(product.image)]
        .filter((image): image is GraphQLSitemapImage => Boolean(image))
    ),
    categorySlugs: (product.categorySlugs || [])
      .filter((slug): slug is string => Boolean(slug)),
  };
}

function mapEmartSitemapCategory(category: EmartSitemapCategoryNode): GraphQLSitemapCategory | null {
  if (!category.slug || !category.name) return null;

  return {
    name: category.name,
    slug: category.slug,
    count: typeof category.count === 'number' ? category.count : undefined,
    date_modified: category.modifiedGmt || undefined,
  };
}

function mapImage(image?: GraphQLImageNode | null): GraphQLSitemapImage | undefined {
  if (!image?.sourceUrl) return undefined;

  return {
    src: image.sourceUrl,
    name: image.title || '',
    alt: image.altText || '',
  };
}

function mapEmartSitemapImage(image?: EmartSitemapImageNode | null): GraphQLSitemapImage | undefined {
  if (!image?.src) return undefined;

  return {
    src: image.src,
    name: image.title || '',
    alt: image.alt || '',
  };
}

function dedupeImages(images: GraphQLSitemapImage[]): GraphQLSitemapImage[] {
  const seen = new Set<string>();

  return images.filter((image) => {
    if (!image.src || seen.has(image.src)) return false;
    seen.add(image.src);
    return true;
  });
}

function getCategoryLastmodBySlug(products: GraphQLSitemapProduct[]): Map<string, string> {
  const datesBySlug = new Map<string, string>();

  for (const product of products) {
    if (!product.date_modified) continue;

    for (const slug of product.categorySlugs) {
      const current = datesBySlug.get(slug);
      if (!current || new Date(product.date_modified) > new Date(current)) {
        datesBySlug.set(slug, product.date_modified);
      }
    }
  }

  return datesBySlug;
}

function firstString(...values: Array<string | null | undefined>): string | undefined {
  return values.find((value): value is string => Boolean(value));
}

function getSitemapPageSize(): number {
  if (!Number.isFinite(GRAPHQL_SITEMAP_PAGE_SIZE)) return 1000;

  return Math.min(Math.max(Math.floor(GRAPHQL_SITEMAP_PAGE_SIZE), 1), 1000);
}

function getSitemapLimit(): number {
  if (!Number.isFinite(GRAPHQL_SITEMAP_LIMIT)) return 20000;

  return Math.min(Math.max(Math.floor(GRAPHQL_SITEMAP_LIMIT), 1), 20000);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function stripHtml(value: string): string {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shouldInferGraphQLEndpoint(wordPressUrl: string, publicSiteUrl: string): boolean {
  if (!wordPressUrl) return false;

  try {
    return new URL(wordPressUrl).origin !== new URL(publicSiteUrl).origin;
  } catch {
    return false;
  }
}
