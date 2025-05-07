export interface DecodedJWT {
  header: Record<string, unknown>;
  payload: Record<string, any>; // exp, iat 포함
}

/** base64url → UTF-8 JSON 파싱 */
function b64urlToJSON(part: string) {
  const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
  const json = atob(base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '='));
  return JSON.parse(decodeURIComponent(escape(json)));
}

export function decode(token: string): DecodedJWT {
  const [header, payload] = token.split('.');
  if (!header || !payload) throw new Error('JWT 형식이 아닙니다');
  return { header: b64urlToJSON(header), payload: b64urlToJSON(payload) };
}
