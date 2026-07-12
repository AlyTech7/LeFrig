import type { APIRequestContext } from '@playwright/test';

const DEFAULT_PHONE = '+22211111111';
const DEFAULT_OTP = '123456';

export async function legacyLogin(
  request: APIRequestContext,
  apiUrl: string,
  phone = DEFAULT_PHONE,
): Promise<string> {
  await request.post(`${apiUrl}/auth/otp/request`, { data: { phone } });
  const verify = await request.post(`${apiUrl}/auth/otp/verify`, {
    data: { phone, code: DEFAULT_OTP },
  });
  if (!verify.ok()) {
    throw new Error(`OTP verify failed: ${verify.status()} ${await verify.text()}`);
  }
  const body = (await verify.json()) as { accessToken: string };
  return body.accessToken;
}

export async function createTestListing(
  request: APIRequestContext,
  apiUrl: string,
  token: string,
  title: string,
) {
  const campsRes = await request.get(`${apiUrl}/camps`);
  const camps = (await campsRes.json()) as { id: string; slug: string }[];
  const camp = camps.find((c) => c.slug === 'aaiun') ?? camps[0];
  if (!camp) throw new Error('No camps in seed');

  const res = await request.post(`${apiUrl}/listings`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title,
      description: 'Anuncio de prueba E2E — producto ficticio para CI.',
      price: 2500,
      currency: 'MRU',
      category: 'other',
      campId: camp.id,
      paymentMethods: ['cash'],
    },
  });
  if (!res.ok()) {
    throw new Error(`Create listing failed: ${res.status()} ${await res.text()}`);
  }
  return (await res.json()) as { id: string; title: string };
}
