import type { SkinQuizResult } from '@/lib/skinQuiz';
import type { WooMetaData } from '@/lib/woocommerce';

export const EMART_SKIN_QUIZ_RESULT_META_KEY = '_emart_skin_quiz_result';
export const EMART_SKIN_QUIZ_UPDATED_AT_META_KEY = '_emart_skin_quiz_updated_at';

export interface StoredSkinQuizResult extends SkinQuizResult {
  savedAt?: string;
}

function findMetaEntry(metaData: WooMetaData[] | undefined, key: string) {
  return (metaData || []).find((item) => item.key === key);
}

export function buildStoredSkinQuizPayload(result: SkinQuizResult, savedAt = new Date().toISOString()): StoredSkinQuizResult {
  return {
    ...result,
    savedAt,
  };
}

export function buildSkinQuizCustomerMeta(metaData: WooMetaData[] | undefined, result: SkinQuizResult, savedAt = new Date().toISOString()) {
  const storedResult = buildStoredSkinQuizPayload(result, savedAt);
  const existingResult = findMetaEntry(metaData, EMART_SKIN_QUIZ_RESULT_META_KEY);
  const existingUpdatedAt = findMetaEntry(metaData, EMART_SKIN_QUIZ_UPDATED_AT_META_KEY);

  return [
    existingResult?.id
      ? { id: existingResult.id, key: EMART_SKIN_QUIZ_RESULT_META_KEY, value: JSON.stringify(storedResult) }
      : { key: EMART_SKIN_QUIZ_RESULT_META_KEY, value: JSON.stringify(storedResult) },
    existingUpdatedAt?.id
      ? { id: existingUpdatedAt.id, key: EMART_SKIN_QUIZ_UPDATED_AT_META_KEY, value: savedAt }
      : { key: EMART_SKIN_QUIZ_UPDATED_AT_META_KEY, value: savedAt },
  ];
}

export function extractStoredSkinQuiz(metaData: WooMetaData[] | undefined): StoredSkinQuizResult | null {
  const resultEntry = findMetaEntry(metaData, EMART_SKIN_QUIZ_RESULT_META_KEY);
  if (!resultEntry) {
    return null;
  }

  try {
    const parsed = typeof resultEntry.value === 'string'
      ? JSON.parse(resultEntry.value)
      : resultEntry.value;

    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const updatedEntry = findMetaEntry(metaData, EMART_SKIN_QUIZ_UPDATED_AT_META_KEY);
    const savedAt = typeof updatedEntry?.value === 'string'
      ? updatedEntry.value
      : typeof (parsed as StoredSkinQuizResult).savedAt === 'string'
        ? (parsed as StoredSkinQuizResult).savedAt
        : undefined;

    return {
      ...(parsed as StoredSkinQuizResult),
      savedAt,
    };
  } catch {
    return null;
  }
}
