export function extractCiToken(
  authorizationHeader: string | null,
  xCiTokenHeader: string | null,
): string | null {
  const headerToken = xCiTokenHeader?.trim();
  if (headerToken) return headerToken;

  const auth = authorizationHeader?.trim();
  if (!auth) return null;

  const match = /^Bearer\s+(.+)$/i.exec(auth);
  return match?.[1]?.trim() || null;
}

import { safeCompareSecret } from "@/lib/security";

export function isCiAuthorized(expectedToken: string | undefined, providedToken: string | null) {
  const expected = expectedToken?.trim();
  if (!expected || !providedToken) return false;
  return safeCompareSecret(expected, providedToken);
}
