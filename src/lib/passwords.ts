// ─── Password hashing (server-only) ───────────────────────────────────────────
// bcrypt only reads the first 72 bytes of its input, so on its own a long passphrase, or a shorter
// one in a script like Devanagari (3 bytes a character), is checked only up to that point.
// Stored formats:
//   $2a$… / $2b$…  legacy: bcrypt over the raw password (bytes after the 72nd are ignored)
//   v2$<bcrypt>    bcrypt over base64(HMAC-SHA256(password)), which depends on every byte
// Both verify. A legacy hash is rewritten as v2 at the next sign-in (see needsRehash()).
//
// The HMAC key is a fixed label, not a secret: it keeps a plain SHA-256 of a password leaked elsewhere
// from being tested directly against these hashes. It isn't derived from AUTH_SECRET on purpose:
// rotating that secret (to end every session) would then make every stored password unverifiable.

import { createHash, createHmac, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import commonPasswordList from './common-passwords.json';

const PREFIX = 'v2$';
const PREHASH_KEY = 'logisticsedge:password:v2';
const ROUNDS = 10;

/** 44 ASCII characters, well inside bcrypt's 72-byte limit. */
function prehash(password: string): string {
  return createHmac('sha256', PREHASH_KEY).update(password, 'utf8').digest('base64');
}

/** Hashes a password in the current (v2) format. `rounds` below the default is for tests only. */
export async function hashPassword(password: string, rounds = ROUNDS): Promise<string> {
  return PREFIX + await bcrypt.hash(prehash(password), rounds);
}

// Compared against when there's no account, so an unknown email takes as long as a wrong password
let dummyHash: Promise<string> | undefined;

/** True if `password` matches `stored` (either format). Pass a missing hash for an unknown account. */
export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) {
    dummyHash ??= hashPassword(randomBytes(16).toString('hex'));
    await verifyPassword(password, await dummyHash);
    return false;
  }
  if (stored.startsWith(PREFIX)) return bcrypt.compare(prehash(password), stored.slice(PREFIX.length));
  if (stored.startsWith('$2')) return bcrypt.compare(password, stored);
  return false;
}

// ─── Which passwords are allowed ──────────────────────────────────────────────
// NIST SP 800-63B: length only, no composition rules; spaces and any characters are fine. Length is
// counted in Unicode characters (an emoji is one), the same way everywhere a password is set or checked.
// It also asks for a blocklist, so a new password is refused when it is
//   • a common or leaked one: in the bundled list, or (checkNewPassword() only) in Have I Been Pwned;
//   • a context word with a few characters around it: LogisticsEdge, the email or the company name.
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

const LEAKED = 'This password appears in lists of leaked passwords. Choose another.';
const FROM_CONTEXT = 'This password is based on your email, your company name or LogisticsEdge. Choose another.';

/** What a password shouldn't be built from, besides the name LogisticsEdge. */
export interface PasswordContext {
  email?: string | null;
  companyName?: string | null;
}

const characters = (password: string) => [...password].length;

// common-passwords.json: the UK NCSC's 100,000 most common passwords from Have I Been Pwned (2019, via
// github.com/danielmiessler/SecLists), keeping only the 9,126 of 10–128 characters (shorter ones are
// refused anyway), lowercased. It's compared case-insensitively.
const listKey = (password: string) => password.normalize('NFKC').toLowerCase();
let commonPasswords: Set<string> | undefined;
const isCommonPassword = (password: string) =>
  (commonPasswords ??= new Set(commonPasswordList)).has(listKey(password));

// Context words are compared as lowercase letters and digits only, so "Acme Logistics" and "acme-logistics"
// match the same. A password is refused when removing them leaves only digits or under 4 characters:
// "AcmeLogistics@2026", "ravi.kumar123", "LogisticsEdge!".
const squash = (text: string) => text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

function contextWords({ email, companyName }: PasswordContext): string[] {
  const words = new Set(['logisticsedge']);
  for (const text of [email, email?.split('@')[0], companyName]) {
    if (!text) continue;
    words.add(squash(text));
    for (const part of text.split(/[^\p{L}\p{N}]+/u)) words.add(squash(part));
  }
  // Longest first, so "acmelogistics" goes before "acme"
  return [...words].filter(w => characters(w) >= 4).sort((a, b) => b.length - a.length);
}

function isBasedOnContext(password: string, context: PasswordContext): boolean {
  const squashed = squash(password);
  let rest = squashed;
  for (const word of contextWords(context)) rest = rest.replaceAll(word, '');
  return rest !== squashed && (characters(rest) < 4 || /^\p{N}*$/u.test(rest));
}

/**
 * Why a new password is refused, or null when it's acceptable. Doesn't ask Have I Been Pwned:
 * where a password is set, use checkNewPassword().
 */
export function passwordProblem(password: string, context: PasswordContext = {}): string | null {
  const length = characters(password);
  if (length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  if (length > PASSWORD_MAX_LENGTH) return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  if (isCommonPassword(password)) return LEAKED;
  if (isBasedOnContext(password, context)) return FROM_CONTEXT;
  return null;
}

/** passwordProblem(), then Have I Been Pwned. For sign-up, invite acceptance and reset links. */
export async function checkNewPassword(password: string, context: PasswordContext): Promise<string | null> {
  return passwordProblem(password, context) ?? (await isPwnedPassword(password) ? LEAKED : null);
}

// Have I Been Pwned's range API (k-anonymity): only the first 5 hex characters of the password's SHA-1
// leave the server, and the reply lists every leaked hash starting with them, padded with fake entries
// (count 0) so its size gives nothing away. It fails open: when the API is down or slower than the
// timeout the password is allowed, having passed the bundled list already.
const PWNED_RANGE_URL = 'https://api.pwnedpasswords.com/range/';
const PWNED_TIMEOUT_MS = 2000;

async function isPwnedPassword(password: string): Promise<boolean> {
  const sha1 = createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase();
  const suffix = sha1.slice(5);
  try {
    const res = await fetch(PWNED_RANGE_URL + sha1.slice(0, 5), {
      headers: { 'Add-Padding': 'true' },
      signal: AbortSignal.timeout(PWNED_TIMEOUT_MS),
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    for (const line of (await res.text()).split('\n')) {
      const [hash, count] = line.trim().split(':');
      if (hash === suffix) return Number(count) > 0;
    }
    return false;
  } catch (err) {
    console.warn('[passwords] Have I Been Pwned check skipped:', err instanceof Error ? err.message : err);
    return false;
  }
}

/** True when no account can have this password, so sign-in can refuse it without hashing. */
export function isPasswordTooLong(password: string): boolean {
  return password.length > 2 * PASSWORD_MAX_LENGTH || characters(password) > PASSWORD_MAX_LENGTH;
}

/**
 * Whether a hash that just matched `password` should be replaced by hashPassword(password).
 * Not when the legacy check only covered the first 72 bytes: whatever came after them was never
 * checked (it may hold a typo), and storing it would lock the user out of their real password.
 * Those accounts keep the legacy hash until the password is next set.
 */
export function needsRehash(stored: string, password: string): boolean {
  return !stored.startsWith(PREFIX) && !bcrypt.truncates(password);
}
