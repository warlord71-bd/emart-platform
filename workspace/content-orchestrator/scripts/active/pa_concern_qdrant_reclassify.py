#!/usr/bin/env python3
"""Reclassify a completed concern audit after deterministic flag-rule fixes."""

import csv
import glob
import json
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from pa_concern_qdrant_assign import is_non_skin_title  # noqa: E402


def severity(flags):
    if 'NON_SKIN_PRODUCT_HAS_CONCERN' in flags:
        return 'CRITICAL'
    if flags & {'EXPLICIT_RULE_CONFLICT', 'STRONG_NEIGHBOR_CONTRADICTION', 'MISSING_WITH_SUPPORTED_RULE'}:
        return 'HIGH'
    if flags & {'CURRENT_CONCERN_LOW_VECTOR_SUPPORT', 'MISSING_WITH_STRONG_NEIGHBORS'}:
        return 'MEDIUM'
    return 'OK'


def main():
    candidates = [p for p in glob.glob('/root/emart-platform/workspace/audit/active/pa-concern-qdrant-catalog-audit-*.csv') if '-corrected' not in p]
    if not candidates:
        raise SystemExit('No source catalog audit found')
    source = Path(sorted(candidates)[-1])
    rows = list(csv.DictReader(source.open(encoding='utf-8')))
    for row in rows:
        flags = set(filter(None, row['flags'].split('|')))
        non_skin = is_non_skin_title(row['title'])
        if 'NON_SKIN_PRODUCT_HAS_CONCERN' in flags and not non_skin:
            flags.remove('NON_SKIN_PRODUCT_HAS_CONCERN')
        current = set(filter(None, row['current_concerns'].split('|')))
        explicit = set(filter(None, row['explicit_supported'].split('|')))
        if current & explicit:
            flags.discard('STRONG_NEIGHBOR_CONTRADICTION')
        if not current and non_skin:
            flags.discard('MISSING_WITH_SUPPORTED_RULE')
            flags.discard('MISSING_WITH_STRONG_NEIGHBORS')
        row['flags'] = '|'.join(sorted(flags))
        row['severity'] = severity(flags)

    target = source.with_name(source.stem + '-corrected.csv')
    with target.open('w', newline='', encoding='utf-8') as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(sorted(rows, key=lambda row: (
            {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'OK': 3}[row['severity']],
            int(row['product_id']))))

    sev = Counter(row['severity'] for row in rows)
    flags = Counter(flag for row in rows for flag in row['flags'].split('|') if flag)
    result = {'source': str(source), 'corrected_report': str(target), 'severity': sev, 'flags': flags}
    target.with_name(target.stem + '-summary.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
