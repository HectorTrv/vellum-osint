/**
 * Heuristic detection of an entity's kind from a free-text input.
 * Used by EntityQuickInput so analysts can paste any IOC and get a typed entity.
 */

const RE = {
  Email:    /^[\w.+-]+@[\w-]+\.[\w.-]+$/i,
  IPv4:     /^(\d{1,3}\.){3}\d{1,3}$/,
  IPv6:     /^([0-9a-f]{1,4}:){2,7}[0-9a-f]{1,4}$/i,
  URL:      /^https?:\/\/\S+$/i,
  Domain:   /^([a-z0-9-]+\.)+[a-z]{2,}$/i,
  MD5:      /^[a-f0-9]{32}$/i,
  SHA1:     /^[a-f0-9]{40}$/i,
  SHA256:   /^[a-f0-9]{64}$/i,
  EthAddr:  /^0x[a-f0-9]{40}$/i,
  BtcAddr:  /^(bc1[a-z0-9]{20,}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/,
  Phone:    /^\+\d{1,3}[\s.-]?\d[\d\s.-]{5,14}\d$/,
  Username: /^@[\w.-]+$/,
};

export type DetectedKind =
  | "Email" | "IP" | "URL" | "Domain" | "Hash" | "Wallet" | "Phone" | "Username" | "Person" | "Custom";

export function detectKind(raw: string): { kind: DetectedKind; confidence: number; hint?: string } {
  const s = raw.trim();
  if (!s) return { kind: "Custom", confidence: 0 };

  if (RE.Email.test(s))    return { kind: "Email",    confidence: 0.98 };
  if (RE.IPv4.test(s)) {
    const ok = s.split(".").every((n) => +n >= 0 && +n <= 255);
    if (ok) return { kind: "IP", confidence: 0.95, hint: "IPv4" };
  }
  if (RE.IPv6.test(s))     return { kind: "IP",       confidence: 0.92, hint: "IPv6" };
  if (RE.URL.test(s))      return { kind: "URL",      confidence: 0.97 };
  if (RE.MD5.test(s))      return { kind: "Hash",     confidence: 0.95, hint: "MD5" };
  if (RE.SHA1.test(s))     return { kind: "Hash",     confidence: 0.95, hint: "SHA-1" };
  if (RE.SHA256.test(s))   return { kind: "Hash",     confidence: 0.96, hint: "SHA-256" };
  if (RE.EthAddr.test(s))  return { kind: "Wallet",   confidence: 0.96, hint: "EVM" };
  if (RE.BtcAddr.test(s))  return { kind: "Wallet",   confidence: 0.85, hint: "BTC" };
  if (RE.Phone.test(s))    return { kind: "Phone",    confidence: 0.85 };
  if (RE.Username.test(s)) return { kind: "Username", confidence: 0.85 };
  if (RE.Domain.test(s))   return { kind: "Domain",   confidence: 0.78 };

  // 2-4 capitalized words → likely a Person name
  if (/^[A-Z][a-z'-]+( [A-Z][a-z'-]+){1,3}$/.test(s)) {
    return { kind: "Person", confidence: 0.6 };
  }
  return { kind: "Custom", confidence: 0.2 };
}
