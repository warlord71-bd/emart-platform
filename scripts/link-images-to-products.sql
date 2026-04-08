-- WordPress Image Linking SQL Script
-- Links product images to products based on filename matching
-- Usage: mysql emart_live < link-images-to-products.sql

-- First, let's see the current state
SELECT 'Current product image status:' as '';
SELECT
    COUNT(DISTINCT p.ID) as total_products,
    COUNT(DISTINCT CASE WHEN pm.meta_value IS NOT NULL THEN p.ID END) as products_with_images
FROM wp4h_posts p
LEFT JOIN wp4h_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
WHERE p.post_type = 'product' AND p.post_status = 'publish';

-- Find attachments
SELECT 'Image attachments found:' as '';
SELECT COUNT(*) as attachment_count
FROM wp4h_posts
WHERE post_type = 'attachment' AND post_mime_type LIKE 'image/%';

-- Let's examine the attachment metadata
SELECT 'Sample attachments:' as '';
SELECT
    p.ID,
    p.post_title,
    p.post_name,
    pm.meta_value as file_path
FROM wp4h_posts p
LEFT JOIN wp4h_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_wp_attached_file'
WHERE p.post_type = 'attachment' AND p.post_mime_type LIKE 'image/%'
LIMIT 10;

-- Create temporary table to match products with images
CREATE TEMPORARY TABLE product_image_mapping AS
SELECT DISTINCT
    prod.ID as product_id,
    prod.post_title as product_name,
    prod.post_name as product_slug,
    att.ID as attachment_id,
    att.post_title as image_title
FROM wp4h_posts prod
CROSS JOIN wp4h_posts att
WHERE prod.post_type = 'product'
  AND prod.post_status = 'publish'
  AND att.post_type = 'attachment'
  AND att.post_mime_type LIKE 'image/%'
  AND (
    -- Match by product name in image title
    LOWER(att.post_title) LIKE CONCAT('%', LOWER(prod.post_title), '%')
    OR LOWER(prod.post_title) LIKE CONCAT('%', LOWER(att.post_title), '%')
    OR LOWER(att.post_name) LIKE CONCAT('%', LOWER(prod.post_name), '%')
    OR LOWER(prod.post_name) LIKE CONCAT('%', LOWER(att.post_name), '%')
  )
ORDER BY product_id, attachment_id;

-- Link first matching image to each product
INSERT INTO wp4h_postmeta (post_id, meta_key, meta_value)
SELECT DISTINCT
    pim.product_id,
    '_thumbnail_id',
    pim.attachment_id
FROM product_image_mapping pim
WHERE NOT EXISTS (
    SELECT 1 FROM wp4h_postmeta pm
    WHERE pm.post_id = pim.product_id
    AND pm.meta_key = '_thumbnail_id'
);

-- Verify the linking
SELECT 'Products with images after linking:' as '';
SELECT
    COUNT(DISTINCT p.ID) as total_products,
    COUNT(DISTINCT CASE WHEN pm.meta_value IS NOT NULL THEN p.ID END) as products_with_images
FROM wp4h_posts p
LEFT JOIN wp4h_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
WHERE p.post_type = 'product' AND p.post_status = 'publish';

-- Show some linked products
SELECT 'Sample linked products:' as '';
SELECT
    p.post_title,
    pm.meta_value as image_id,
    att.post_title as image_title
FROM wp4h_posts p
LEFT JOIN wp4h_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
LEFT JOIN wp4h_posts att ON CAST(pm.meta_value as UNSIGNED) = att.ID
WHERE p.post_type = 'product' AND p.post_status = 'publish' AND pm.meta_value IS NOT NULL
LIMIT 10;
