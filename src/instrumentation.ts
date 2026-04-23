/**
 * Next.js Instrumentation — runs once on server startup.
 * Used to verify the license key before the app serves requests.
 */

export async function register() {
  // Only run on the server (not during build or in the edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { checkLicense } = await import('./lib/license');
    const license = checkLicense();

    if (!license) {
      console.warn('');
      console.warn('  ============================================================');
      console.warn('  WARNING: No valid Taban license key found.');
      console.warn('  Set Taban_LICENSE_KEY in your .env.local file.');
      console.warn('  Run "npm run setup" to configure your license.');
      console.warn('  Contact hello@taban.health to obtain a license.');
      console.warn('  ============================================================');
      console.warn('');
    } else if (license.expired) {
      console.warn('');
      console.warn('  ============================================================');
      console.warn(`  WARNING: Taban license expired on ${license.expiry.slice(0, 4)}-${license.expiry.slice(4, 6)}-${license.expiry.slice(6, 8)}.`);
      console.warn('  Contact hello@taban.health to renew your license.');
      console.warn('  ============================================================');
      console.warn('');
    } else {
      console.log(`  Taban licensed to: ${license.org} (${license.plan})`);
    }
  }
}
