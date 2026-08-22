'use strict';

/** Config compartida para scripts de operaciones (Clerk, DO legacy, Vercel). */
function requireEnv(name, hint) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Falta ${name}.${hint ? ` ${hint}` : ''}`);
    process.exit(1);
  }
  return value;
}

function apiPublicUrl() {
  return (process.env.API_PUBLIC_URL?.trim() || 'https://api.lefrig.com').replace(/\/$/, '');
}

function webhookUrl() {
  const explicit = process.env.WEBHOOK_URL?.trim();
  if (explicit) return explicit;
  return `${apiPublicUrl()}/auth/clerk/webhook`;
}

function doAppIds() {
  const raw = process.env.DO_APP_IDS?.trim() || process.env.DO_APP_ID?.trim();
  if (!raw) return [];
  return raw.split(',').map((id) => id.trim()).filter(Boolean);
}

function requireDoAppIds() {
  const ids = doAppIds();
  if (ids.length === 0) {
    console.error(
      'Falta DO_APP_ID o DO_APP_IDS (comma-separated). Solo scripts legacy de DigitalOcean.',
    );
    process.exit(1);
  }
  return ids;
}

module.exports = {
  apiPublicUrl,
  webhookUrl,
  doAppIds,
  requireDoAppIds,
  requireDoAppId: () => requireDoAppIds()[0],
  requireClerkSvixApp: () =>
    requireEnv('CLERK_SVIX_APP_ID', 'ID de instancia Clerk (portal Svix).'),
  requireClerkSvixEndpoint: () =>
    requireEnv('CLERK_SVIX_ENDPOINT_ID', 'ID del endpoint webhook en Svix.'),
};
