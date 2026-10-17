const FACEBOOK_HOSTS = /(^|\.)(facebook\.com|facebook\.net|fb\.com|fb\.me|fb\.watch)$/i;

/**
 * Whether a visitor arrived from Facebook, based on the referring page's URL.
 * Facebook in-app browsers may send no referrer; callers should also treat an
 * `fbclid` query parameter as a Facebook arrival.
 */
export function isFacebookReferrer(referrer: string): boolean {
  if (!referrer) return false;
  try {
    return FACEBOOK_HOSTS.test(new URL(referrer).hostname);
  } catch {
    return false;
  }
}
