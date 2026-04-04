/**
 * Default prices — single source of truth.
 * Update this file to change all default prices across the application.
 *
 * Keys follow the pattern:
 *   - Regular products:     product ID  (e.g. "lpr", "cctv")
 *   - K-Share tiers:        "kshare_<tier>"
 *   - Professional Services:"services_<package>"
 */

export const PERP_MULTIPLIER  = 3.5;
export const SUPPORT_PCT      = 0.20;

export const DEFAULT_ANNUAL_PRICES: Record<string, number> = {
  // Platform & licenses
  core:      5_000,
  cctv:        100,
  lpr:         500,
  face:        625,
  analytics:   556,
  users:       100,
  iot:           5,
  kreact:       50,

  // K-Share — priced per city-population tier
  kshare_entry:       0,
  kshare_small:  10_000,
  kshare_medium: 20_000,
  kshare_large:  35_000,
  kshare_mega:   50_000,

  // Professional Services (one-time fees, not subject to ×3.5 perpetual rule)
  services_installation: 10_000,
  services_training:      2_250,
  services_full:         15_000,
};

/** Returns the default annual price for a given price key. */
export function getDefaultPrice(key: string): number {
  return DEFAULT_ANNUAL_PRICES[key] ?? 0;
}

/** Returns true if the provided price matches the default for that key. */
export function isDefaultPrice(key: string, price: number): boolean {
  return DEFAULT_ANNUAL_PRICES[key] === price;
}

/**
 * Returns the canonical price-key for a product, incorporating tier/package
 * selection so overrides are stored per-tier rather than per-product.
 */
export function getPriceKey(
  productId: string,
  kshareTier?: string,
  servicesPackage?: string
): string {
  if (productId === "kshare")    return `kshare_${kshareTier    ?? "entry"}`;
  if (productId === "services")  return `services_${servicesPackage ?? "installation"}`;
  return productId;
}
