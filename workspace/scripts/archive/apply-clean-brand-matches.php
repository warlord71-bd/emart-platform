<?php
/**
 * Convert confident noisy pa_brand manual-review rows into clean product_brand assignments.
 *
 * Dry-run:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/apply-clean-brand-matches.php
 *
 * Apply:
 *   wp --path=/var/www/wordpress --allow-root eval-file workspace/scripts/apply-clean-brand-matches.php apply
 */

$argv = array_slice($_SERVER['argv'] ?? [], 1);
$apply = in_array('apply', $argv, true) || in_array('--apply', $argv, true);
$root = dirname(__DIR__, 2);
$manual_csv = $root . '/workspace/audit/seo/brand-source-unification-20260503/manual-review.csv';
$out_dir = $root . '/workspace/audit/seo/brand-source-unification-20260503/clean-brand-matches-20260503';

if (!is_dir($out_dir)) {
    mkdir($out_dir, 0775, true);
}

function emart_clean_brand_norm($value) {
    $value = html_entity_decode((string) $value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $value = strtolower($value);
    $value = preg_replace('/[\x{2018}\x{2019}`\']+/u', '', $value);
    $value = str_replace('&', ' and ', $value);
    $value = preg_replace('/[^a-z0-9]+/', ' ', $value);
    return trim(preg_replace('/ +/', ' ', $value));
}

function emart_clean_brand_slug($value) {
    $slug = emart_clean_brand_norm($value);
    $slug = str_replace(' ', '-', $slug);
    return trim($slug, '-');
}

function emart_clean_brand_read_csv($path) {
    $handle = fopen($path, 'r');
    if (!$handle) {
        throw new RuntimeException("Cannot open {$path}");
    }
    $headers = fgetcsv($handle);
    $rows = [];
    while (($cells = fgetcsv($handle)) !== false) {
        $row = [];
        foreach ($headers as $index => $header) {
            $row[$header] = $cells[$index] ?? '';
        }
        $rows[] = $row;
    }
    fclose($handle);
    return [$headers, $rows];
}

function emart_clean_brand_write_csv_assoc($path, $headers, $rows) {
    $handle = fopen($path, 'w');
    fputcsv($handle, $headers);
    foreach ($rows as $row) {
        $cells = [];
        foreach ($headers as $header) {
            $cells[] = $row[$header] ?? '';
        }
        fputcsv($handle, $cells);
    }
    fclose($handle);
}

function emart_clean_brand_write_csv($path, $headers, $rows) {
    $handle = fopen($path, 'w');
    fputcsv($handle, $headers);
    foreach ($rows as $row) {
        $cells = [];
        foreach ($headers as $header) {
            $cells[] = $row[$header] ?? '';
        }
        fputcsv($handle, $cells);
    }
    fclose($handle);
}

function emart_clean_brand_words($norm) {
    if ($norm === '') {
        return [];
    }
    return explode(' ', $norm);
}

function emart_clean_brand_boundary_match($haystack_norm, $needle_norm) {
    return $haystack_norm === $needle_norm
        || str_starts_with($haystack_norm, $needle_norm . ' ')
        || str_ends_with($haystack_norm, ' ' . $needle_norm)
        || str_contains($haystack_norm, ' ' . $needle_norm . ' ');
}

function emart_clean_brand_display($name) {
    $decoded = trim(preg_replace('/ +/', ' ', html_entity_decode((string) $name, ENT_QUOTES | ENT_HTML5, 'UTF-8')));
    $norm = emart_clean_brand_norm($decoded);
    $overrides = [
        'some by me' => 'Some By Mi',
        'some by mi' => 'Some By Mi',
        'dear klairs' => 'Dear Klairs',
        'i am from' => 'I am From',
        'im from' => 'I am From',
        'the inkey list' => 'The Inkey List',
        'mary and may' => 'Mary & May',
        'bath and body works' => 'Bath & Body Works',
        'clean and clear' => 'Clean & Clear',
        'dot and key' => 'Dot & Key',
        'loreal' => "L'Oreal",
        'paulas choice' => "Paula's Choice",
        'stives' => 'St. Ives',
        'k secret' => 'KSECRET',
        'ksecret' => 'KSECRET',
        'rom and nd' => 'Romnd',
        'romnd' => 'Romnd',
        'skin aqua' => 'SkinAqua',
        'skin cafe' => 'Skincafe',
        'pinkflash' => 'PinkFlash',
        'pinkflash lasting matte' => 'PinkFlash',
        'skino' => "Skin'O",
        'swiss beauty matte' => 'Swiss Beauty',
        'technic cosmetics' => 'Technic',
        'trendy beauties liquid' => 'Trendy Beautis',
        'ombre perfumed' => 'Ombre',
        'oriox aroma' => 'Oriox',
        'welcos' => 'Welcos Confume',
        'confume' => 'Welcos Confume',
        'purito' => 'Purito Seoul',
        'rohto mentholatum' => 'Rohto Mentholatum',
    ];
    if (isset($overrides[$norm])) {
        return $overrides[$norm];
    }
    return $decoded;
}

function emart_clean_brand_should_self_create($source_name, $source_count, $product_name, $product_slug) {
    $source_norm = emart_clean_brand_norm($source_name);
    $product_norm = emart_clean_brand_norm($product_name . ' ' . $product_slug);
    $words = emart_clean_brand_words($source_norm);
    if ($source_norm === '' || count($words) > 4 || strlen($source_norm) < 3 || preg_match('/[0-9]/', $source_norm)) {
        return false;
    }
    if ($source_count < 3) {
        return false;
    }
    $blocked_exact = [
        'xyz', 'unilever', 'returnu', 'on the', 'essence', 'rohto', 'melano',
        'korea red ginseng', 'nature beauty', 'everly matte me', 'boom de ah',
        'drforhair unove deep',
    ];
    if (in_array($source_norm, $blocked_exact, true)) {
        return false;
    }
    $blocked_fragments = [
        ' matte', ' liquid', ' waterproof', ' matcha biome', ' moringa creamide',
        ' all clean', ' pore dark', ' pdrn pink', ' kojic acid', ' green tomato',
        ' swimming pool', ' dress and', ' aroma', ' perfumed', ' last',
        ' unove', ' deep damage', ' super stay',
        ' snail', ' cica', ' serum', ' toner', ' cream', ' mask', ' cleanser',
        ' ampoule', ' lotion', ' sunscreen', ' sun screen', ' body wash',
    ];
    foreach ($blocked_fragments as $fragment) {
        if (str_contains(' ' . $source_norm . ' ', $fragment)) {
            return false;
        }
    }
    return emart_clean_brand_boundary_match($product_norm, $source_norm);
}

function emart_clean_brand_term_by_slug($slug) {
    $term = get_term_by('slug', $slug, 'product_brand');
    return $term ?: null;
}

function emart_clean_brand_get_or_create_term($name, &$created_terms, $apply) {
    $slug = emart_clean_brand_slug($name);
    $term = emart_clean_brand_term_by_slug($slug);
    if ($term) {
        return $term;
    }
    if (!$apply) {
        return (object) [
            'term_id' => '',
            'term_taxonomy_id' => '',
            'name' => $name,
            'slug' => $slug,
            'dry_run_new_term' => true,
        ];
    }
    $created = wp_insert_term($name, 'product_brand', ['slug' => $slug]);
    if (is_wp_error($created)) {
        throw new RuntimeException($created->get_error_message());
    }
    $term = get_term((int) $created['term_id'], 'product_brand');
    $created_terms[] = [
        'target_product_brand_name' => $term->name,
        'target_product_brand_slug' => $term->slug,
        'term_id' => $term->term_id,
        'term_taxonomy_id' => $term->term_taxonomy_id,
    ];
    return $term;
}

$approved_names = [
    'innisfree', 'Purito Seoul', 'Welcos Confume', 'Beaute', 'Simple', 'HTS', 'Claires',
    'Kosmedica', 'Skylake', 'Son & Park', 'Heeyul', 'Jiggot', 'Emart Combo', 'Romnd',
    'Yadha', 'Xisjoem', 'Wishcare', 'W7', 'Wskinlab', 'Vatika Naturals', 'vaseline',
    'Valencia Gio', 'Trendy Beautis', 'Tresemme', 'Sudocrem', 'Technic', 'Swiss Beauty',
    'Sunsilk', 'Streax', "Skin'O", 'skinLogic', 'Skincafe', 'Shiliya', 'Seravix',
    'SebaMed', 'Sadoer', 'SkinAqua', 'Rimmel', 'Ribana', 'Remington', 'Rajkonna',
    'Ponds', 'PinkFlash', 'Pastel Beauty', 'Oporajita', 'Ombre', 'OgX', 'Some By Mi',
    'Dear Klairs', 'I am From',
];

$known_clean_names = [
    'Some By Mi', 'Neutrogena', 'Cos De Baha', 'Maybelline', 'The Body Shop',
    'The Derma Co', 'ISNTREE', 'Numbuzin', 'Beauty Glazed', 'Mary & May',
    'The Inkey List', 'La Roche Posay', 'Benton', 'Haruharu Wonder', 'I am From',
    'M.A.C', 'Round Lab', 'iUNIK', 'Rovectin', 'NEOGEN', 'Jumiso', 'Skinfood',
    'Pyunkang Yul', 'Bath & Body Works', 'IZEZE', 'KSECRET', 'Garnier', 'Eucerin',
    'Hada Labo', 'Bad Skin', 'Palmers', 'Torriden', 'Heimish', 'Rated Green',
    'House of Hur', 'Clean & Clear', 'Mixsoon', "L'Oreal", 'Goodal', 'Biore',
    'Arencia', 'Daily Comma', 'Be The Skin', 'Nacific', 'Freeman', 'St. Ives',
    'Paxmoly', 'Nineless', 'VT Cosmetics', 'Thank You Farmer', "Paula's Choice",
    'L.A. Girl', 'Kota Cosmetics', 'By Wishtrend', 'Banila Co', 'Mamaearth',
    'LAIKOU', 'PanOxyl', 'Mielle', 'Medi-Peel', 'Kose', 'Bellflower',
    'CNP Laboratory', 'Tirtir', 'Frankly', 'Bonajour', 'Athena', 'The Yeon',
    'The Saem', 'Dr. Ceuracle', 'Acwell', 'Xpel', 'Superdrug', 'Kojie San',
    'Kiss Beauty', 'Eqqualberry', 'W.Dressroom', "A'pieu", 'Dr.G', 'Differin',
    'Lubriderm', 'Julyme', 'Herbal Essences', 'Pure Ground', 'MIZON', 'Skinmiso',
    'Secret Key', 'Coreana', 'Koelcia', 'Farmstay', 'MedB', 'Botanics', 'Astral',
    'Dove', 'Oral-B', 'Nair', 'Veet', 'Abib', 'Biodance', 'BIOAQUA', 'DHC',
    'Embryolisse', 'Fruida', 'Manyo', 'Minimalist', 'Philosophy', 'Roothair',
    'Lilac', 'Laxzin', 'Insight', 'Wet n Wild', 'G9 Skin', 'Freemo Factory',
    'KAINE', 'Belif', 'Banila Co', 'Durex', 'Matrix', 'Lakme', 'Lion', 'Sana',
    'Topicals', 'MAKE9', 'Sheglam', 'Farlin', 'Savlon', 'MamyPoko', 'Dr.ForHair',
    'Aromatica', 'FULLY',
];

$alias_exact = [
    'some by me' => 'Some By Mi',
    'some by mi' => 'Some By Mi',
    'dear klairs' => 'Dear Klairs',
    'i am from' => 'I am From',
    'im from' => 'I am From',
    'purito' => 'Purito Seoul',
    'rom and nd' => 'Romnd',
    'skin cafe' => 'Skincafe',
    'skin aqua' => 'SkinAqua',
    'skin aqua super' => 'SkinAqua',
    'swiss beauty matte' => 'Swiss Beauty',
    'technic cosmetics' => 'Technic',
    'trendy beauties liquid' => 'Trendy Beautis',
    'pinkflash lasting matte' => 'PinkFlash',
    'ombre perfumed' => 'Ombre',
    'oriox aroma' => 'Oriox',
    'welcos' => 'Welcos Confume',
    'confume' => 'Welcos Confume',
    'k secret seoul 1988' => 'KSECRET',
    'celimax the real' => 'Celimax',
    'celimax pore dark' => 'Celimax',
    'medicube pdrn pink' => 'Medicube',
    'medicube kojic acid' => 'Medicube',
    'heimish matcha biome' => 'Heimish',
    'heimish moringa creamide' => 'Heimish',
    'heimish all clean' => 'Heimish',
    'on the' => 'On The Body',
    'w skin laboratory' => 'Wskinlab',
    'w skin laboratory a m' => 'Wskinlab',
    'wskin lab ac' => 'Wskinlab',
    'rohto' => 'Rohto Mentholatum',
    'melano' => 'Rohto Mentholatum',
    'mizon' => 'MIZON',
    'farm stay' => 'Farmstay',
    'farm stay collagen' => 'Farmstay',
    'farm stay citrus' => 'Farmstay',
    'secret key' => 'Secret Key',
    'seba med' => 'SebaMed',
    'seba med anti' => 'SebaMed',
    'sabamed' => 'SebaMed',
    'banilla co' => 'Banila Co',
    'rom and nd zero velvet' => 'Romnd',
    'rom and nd the juicy' => 'Romnd',
    'trendy beauties pro' => 'Trendy Beautis',
    'sana namreko' => 'Sana',
    'matrix opti care' => 'Matrix',
    'lakme sun expert' => 'Lakme',
    'lion pair medicated' => 'Lion',
    'durex extra thin' => 'Durex',
    'durex durex thin' => 'Durex',
    'dr forhair phyto fresh' => 'Dr.ForHair',
    'belif the true' => 'Belif',
    'kaine rosemary relief' => 'KAINE',
    'kaine kombu balancing' => 'KAINE',
    'kaine green fit' => 'KAINE',
    'kaine kombu' => 'KAINE',
    'l or al' => "L'Oreal",
    'mac air of' => 'M.A.C',
    'st lves' => 'St. Ives',
    'oral b' => 'Oral-B',
    'dove baby wipes' => 'Dove',
    'savlon wet wipes' => 'Savlon',
    'mamy poko pants' => 'MamyPoko',
    'farlin baby wet' => 'Farlin',
    'aromatica rosemary scalp' => 'Aromatica',
    'care nel anti melasma cica' => 'Carenel',
    'fully green tomato' => 'FULLY',
    'fully rice ceramide' => 'FULLY',
];

[$manual_headers, $manual_rows] = emart_clean_brand_read_csv($manual_csv);

$source_counts = [];
foreach ($manual_rows as $row) {
    $source_norm = emart_clean_brand_norm($row['source_pa_brand_name'] ?? '');
    $source_counts[$source_norm] = ($source_counts[$source_norm] ?? 0) + 1;
}

$brand_refs = [];
$add_brand_ref = function ($name, $source) use (&$brand_refs) {
    $display = emart_clean_brand_display($name);
    $norm = emart_clean_brand_norm($display);
    if ($norm === '' || preg_match('/^[0-9 ]+$/', $norm)) {
        return;
    }
    $slug = emart_clean_brand_slug($display);
    $brand_refs[$norm] = [
        'name' => $display,
        'slug' => $slug,
        'norm' => $norm,
        'source' => $source,
    ];
};

$terms = get_terms(['taxonomy' => 'product_brand', 'hide_empty' => false]);
if (is_wp_error($terms)) {
    throw new RuntimeException($terms->get_error_message());
}
foreach ($terms as $term) {
    if ((int) $term->count <= 0) {
        continue;
    }
    $add_brand_ref($term->name, 'existing_product_brand');
}
foreach ($approved_names as $name) {
    $add_brand_ref($name, 'approved_user_list');
}
foreach ($known_clean_names as $name) {
    $add_brand_ref($name, 'known_confident_brand');
}

usort($brand_refs, fn($a, $b) => strlen($b['norm']) <=> strlen($a['norm']));

function emart_clean_brand_pick_match($row, $brand_refs, $alias_exact, $source_counts) {
    $source_name = $row['source_pa_brand_name'] ?? '';
    $source_norm = emart_clean_brand_norm($source_name);
    $product_norm = emart_clean_brand_norm(($row['product_name'] ?? '') . ' ' . ($row['product_slug'] ?? ''));
    if ($source_norm === '') {
        return [null, 'empty_source_pa_brand_name'];
    }

    if (isset($alias_exact[$source_norm])) {
        $target = emart_clean_brand_display($alias_exact[$source_norm]);
        $target_norm = emart_clean_brand_norm($target);
        if ($source_norm === 'on the' && !emart_clean_brand_boundary_match($product_norm, 'on the body')) {
            return [null, 'alias_needs_product_title_confirmation'];
        }
        return [[
            'name' => $target,
            'slug' => emart_clean_brand_slug($target),
            'match_rule' => 'exact_alias',
            'reference_source' => 'alias',
            'target_norm' => $target_norm,
        ], null];
    }

    $hits = [];
    foreach ($brand_refs as $brand) {
        if (emart_clean_brand_boundary_match($source_norm, $brand['norm'])) {
            $hits[] = $brand;
        }
    }
    if (count($hits) === 1) {
        return [[
            'name' => $hits[0]['name'],
            'slug' => $hits[0]['slug'],
            'match_rule' => $source_norm === $hits[0]['norm'] ? 'exact_brand_name' : 'brand_with_extra_source_text',
            'reference_source' => $hits[0]['source'],
            'target_norm' => $hits[0]['norm'],
        ], null];
    }
    if (count($hits) > 1) {
        $confirmed = [];
        foreach ($hits as $brand) {
            if (emart_clean_brand_boundary_match($product_norm, $brand['norm']) || str_contains($product_norm, str_replace(' ', '', $brand['norm']))) {
                $confirmed[$brand['norm']] = $brand;
            }
        }
        if (count($confirmed) === 1) {
            $brand = array_values($confirmed)[0];
            return [[
                'name' => $brand['name'],
                'slug' => $brand['slug'],
                'match_rule' => 'product_title_decided_ambiguous_source',
                'reference_source' => $brand['source'],
                'target_norm' => $brand['norm'],
            ], null];
        }
        return [null, 'ambiguous_brand_match:' . implode('|', array_map(fn($brand) => $brand['name'], $hits))];
    }

    if (emart_clean_brand_should_self_create($source_name, $source_counts[$source_norm] ?? 0, $row['product_name'] ?? '', $row['product_slug'] ?? '')) {
        $target = emart_clean_brand_display($source_name);
        return [[
            'name' => $target,
            'slug' => emart_clean_brand_slug($target),
            'match_rule' => 'confident_source_name_created_as_brand',
            'reference_source' => 'source_pa_brand_name',
            'target_norm' => emart_clean_brand_norm($target),
        ], null];
    }

    return [null, 'no_confident_clean_brand_match'];
}

$planned = [];
$skipped = [];
$remove_ids = [];

foreach ($manual_rows as $row) {
    $product_id = (string) ($row['product_id'] ?? '');
    $post = get_post((int) $product_id);
    if (!$post || $post->post_type !== 'product' || $post->post_status !== 'publish') {
        $skipped[] = [
            'product_id' => $product_id,
            'product_name' => $row['product_name'] ?? '',
            'source_pa_brand_name' => $row['source_pa_brand_name'] ?? '',
            'target_product_brand_name' => '',
            'target_product_brand_slug' => '',
            'reason' => 'published_product_not_found',
        ];
        continue;
    }

    [$match, $reason] = emart_clean_brand_pick_match($row, $brand_refs, $alias_exact, $source_counts);
    if (!$match) {
        $skipped[] = [
            'product_id' => $product_id,
            'product_name' => $row['product_name'] ?? '',
            'source_pa_brand_name' => $row['source_pa_brand_name'] ?? '',
            'target_product_brand_name' => '',
            'target_product_brand_slug' => '',
            'reason' => $reason,
        ];
        continue;
    }

    $existing_terms = wp_get_object_terms((int) $product_id, 'product_brand');
    $existing_terms = is_wp_error($existing_terms) ? [] : $existing_terms;
    $existing_slugs = array_map(fn($term) => $term->slug, $existing_terms);
    $existing_names = array_map(fn($term) => $term->name, $existing_terms);
    if ($existing_slugs && !in_array($match['slug'], $existing_slugs, true)) {
        $skipped[] = [
            'product_id' => $product_id,
            'product_name' => $row['product_name'] ?? '',
            'source_pa_brand_name' => $row['source_pa_brand_name'] ?? '',
            'target_product_brand_name' => $match['name'],
            'target_product_brand_slug' => $match['slug'],
            'reason' => 'product_already_has_different_product_brand:' . implode('|', $existing_names),
        ];
        continue;
    }

    $planned[] = [
        'product_id' => $product_id,
        'product_name' => $post->post_title,
        'product_slug' => $post->post_name,
        'source_pa_brand_name' => $row['source_pa_brand_name'] ?? '',
        'source_pa_brand_slug' => $row['source_pa_brand_slug'] ?? '',
        'target_product_brand_name' => $match['name'],
        'target_product_brand_slug' => $match['slug'],
        'match_rule' => $match['match_rule'],
        'reference_source' => $match['reference_source'],
        'existing_product_brand_name' => implode('|', $existing_names),
        'existing_product_brand_slug' => implode('|', $existing_slugs),
        'action' => in_array($match['slug'], $existing_slugs, true) ? 'already_assigned_remove_from_manual' : 'assign_product_brand',
    ];
}

$planned_ids = array_map(fn($row) => (int) $row['product_id'], $planned);
$planned_new_brand_slugs = [];
foreach ($planned as $row) {
    if (!emart_clean_brand_term_by_slug($row['target_product_brand_slug'])) {
        $planned_new_brand_slugs[$row['target_product_brand_slug']] = $row['target_product_brand_name'];
    }
}
$backup_path = $out_dir . '/pre-clean-brand-match-backup.tsv';
$backup_lines = ["product_id\tproduct_name\tterm_id\tterm_taxonomy_id\tslug\tname"];
if ($planned_ids) {
    $backup_ids = implode(',', array_filter($planned_ids));
    $backup_sql = "
        SELECT p.ID product_id, p.post_title product_name, t.term_id, tt.term_taxonomy_id, t.slug, t.name
        FROM {$GLOBALS['wpdb']->posts} p
        LEFT JOIN {$GLOBALS['wpdb']->term_relationships} tr ON tr.object_id=p.ID
        LEFT JOIN {$GLOBALS['wpdb']->term_taxonomy} tt ON tt.term_taxonomy_id=tr.term_taxonomy_id AND tt.taxonomy='product_brand'
        LEFT JOIN {$GLOBALS['wpdb']->terms} t ON t.term_id=tt.term_id
        WHERE p.ID IN ({$backup_ids})
        ORDER BY p.ID, t.name
    ";
    $backup_rows = $GLOBALS['wpdb']->get_results($backup_sql, ARRAY_N);
    foreach ($backup_rows as $backup_row) {
        $backup_lines[] = implode("\t", array_map(fn($value) => (string) $value, $backup_row));
    }
}
file_put_contents($backup_path, implode("\n", $backup_lines) . "\n");

$created_terms = [];
$applied = [];
$rollback = [];
if ($apply) {
    foreach ($planned as $row) {
        $term = emart_clean_brand_get_or_create_term($row['target_product_brand_name'], $created_terms, true);
        if ($row['action'] === 'assign_product_brand') {
            $result = wp_set_object_terms((int) $row['product_id'], [(int) $term->term_id], 'product_brand', true);
            if (is_wp_error($result)) {
                $skipped[] = [
                    'product_id' => $row['product_id'],
                    'product_name' => $row['product_name'],
                    'source_pa_brand_name' => $row['source_pa_brand_name'],
                    'target_product_brand_name' => $row['target_product_brand_name'],
                    'target_product_brand_slug' => $row['target_product_brand_slug'],
                    'reason' => $result->get_error_message(),
                ];
                continue;
            }
            $rollback[] = "DELETE FROM {$GLOBALS['wpdb']->term_relationships} WHERE object_id=" . (int) $row['product_id'] . " AND term_taxonomy_id=" . (int) $term->term_taxonomy_id . ";";
        }
        $row['term_id'] = $term->term_id;
        $row['term_taxonomy_id'] = $term->term_taxonomy_id;
        $applied[] = $row;
        $remove_ids[(string) $row['product_id']] = true;
    }
    $manual_rows = array_values(array_filter($manual_rows, fn($row) => !isset($remove_ids[(string) $row['product_id']])));
    emart_clean_brand_write_csv_assoc($manual_csv, $manual_headers, $manual_rows);
    $term_taxonomy_ids = $GLOBALS['wpdb']->get_col("SELECT term_taxonomy_id FROM {$GLOBALS['wpdb']->term_taxonomy} WHERE taxonomy='product_brand'");
    wp_update_term_count_now(array_map('intval', $term_taxonomy_ids), 'product_brand');
} else {
    foreach ($planned as $row) {
        $term = emart_clean_brand_get_or_create_term($row['target_product_brand_name'], $created_terms, false);
        $row['term_id'] = $term->term_id ?? '';
        $row['term_taxonomy_id'] = $term->term_taxonomy_id ?? '';
        $applied[] = $row;
    }
}

emart_clean_brand_write_csv($out_dir . '/applied-clean-brand-matches.csv', [
    'product_id', 'product_name', 'product_slug', 'source_pa_brand_name', 'source_pa_brand_slug',
    'target_product_brand_name', 'target_product_brand_slug', 'match_rule', 'reference_source',
    'existing_product_brand_name', 'existing_product_brand_slug', 'action', 'term_id', 'term_taxonomy_id',
], $applied);
emart_clean_brand_write_csv($out_dir . '/skipped-clean-brand-matches.csv', [
    'product_id', 'product_name', 'source_pa_brand_name', 'target_product_brand_name',
    'target_product_brand_slug', 'reason',
], $skipped);
emart_clean_brand_write_csv($out_dir . '/created-clean-brand-terms.csv', [
    'target_product_brand_name', 'target_product_brand_slug', 'term_id', 'term_taxonomy_id',
], $created_terms);
file_put_contents($out_dir . '/rollback-clean-brand-matches.sql', implode("\n", $rollback) . "\n");

$target_counts = [];
foreach ($applied as $row) {
    $target_counts[$row['target_product_brand_name']] = ($target_counts[$row['target_product_brand_name']] ?? 0) + 1;
}
arsort($target_counts);
$top_targets = array_slice(array_map(fn($name, $count) => "{$name}:{$count}", array_keys($target_counts), array_values($target_counts)), 0, 30);

$summary = [
    'mode=' . ($apply ? 'apply' : 'dry-run'),
    'manual_csv=' . $manual_csv,
    'output_dir=' . $out_dir,
    'manual_rows_before=' . count($source_counts) . ' unique_source_names / ' . (count($manual_rows) + ($apply ? count($remove_ids) : 0)) . ' rows',
    'planned_or_applied=' . count($applied),
    'skipped_or_remaining=' . count($skipped),
    'planned_new_terms=' . count($planned_new_brand_slugs),
    'created_terms=' . count($created_terms),
    'manual_rows_after=' . ($apply ? count($manual_rows) : count($manual_rows)),
    'backup_tsv=' . $backup_path,
    'rollback_sql=' . $out_dir . '/rollback-clean-brand-matches.sql',
    'top_targets=' . implode(', ', $top_targets),
    '',
];
file_put_contents($out_dir . '/summary.txt', implode("\n", $summary));
echo implode("\n", $summary);
