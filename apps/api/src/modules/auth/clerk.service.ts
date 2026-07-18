import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient, verifyToken, type User as ClerkUser } from '@clerk/backend';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuthUserPayload {
  sub: string;
  clerkId?: string;
  phone?: string;
  email?: string;
  roles: string[];
  campId?: string;
}

type EmailLike = {
  id: string;
  emailAddress?: string;
  email_address?: string;
  verification?: { status?: string } | null;
};

type PhoneLike = {
  id: string;
  phoneNumber?: string;
  phone_number?: string;
};

/** Normaliza payload webhook Svix (snake_case) al shape del SDK (camelCase). */
export function normalizeClerkUserPayload(data: Record<string, unknown>): ClerkUser {
  const rawEmails = (data.emailAddresses ?? data.email_addresses ?? []) as EmailLike[];
  const rawPhones = (data.phoneNumbers ?? data.phone_numbers ?? []) as PhoneLike[];

  return {
    id: String(data.id),
    firstName: (data.firstName ?? data.first_name ?? null) as string | null,
    lastName: (data.lastName ?? data.last_name ?? null) as string | null,
    username: (data.username ?? null) as string | null,
    imageUrl: String(data.imageUrl ?? data.image_url ?? ''),
    primaryEmailAddressId: (data.primaryEmailAddressId ??
      data.primary_email_address_id ??
      null) as string | null,
    primaryPhoneNumberId: (data.primaryPhoneNumberId ??
      data.primary_phone_number_id ??
      null) as string | null,
    emailAddresses: rawEmails.map((e) => ({
      id: e.id,
      emailAddress: e.emailAddress ?? e.email_address ?? '',
      verification: e.verification ?? null,
    })),
    phoneNumbers: rawPhones.map((p) => ({
      id: p.id,
      phoneNumber: p.phoneNumber ?? p.phone_number ?? '',
    })),
    publicMetadata: (data.publicMetadata ?? data.public_metadata ?? {}) as Record<string, unknown>,
  } as ClerkUser;
}

@Injectable()
export class ClerkService {
  private readonly logger = new Logger(ClerkService.name);
  private client: ReturnType<typeof createClerkClient> | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    if (secretKey) {
      this.client = createClerkClient({ secretKey });
    } else {
      this.logger.warn('CLERK_SECRET_KEY no configurada — auth Clerk deshabilitado');
    }
  }

  isConfigured(): boolean {
    return !!this.client && !!this.config.get('CLERK_SECRET_KEY');
  }

  private authorizedParties(): string[] | undefined {
    const raw = this.config.get<string>('CLERK_AUTHORIZED_PARTIES')?.trim();
    if (raw) {
      const list = raw
        .split(',')
        .map((o) => o.trim().replace(/\/$/, ''))
        .filter(Boolean);
      return list.length > 0 ? list : undefined;
    }
    const cors = this.config.get<string>('CORS_ORIGINS')?.trim();
    if (cors && cors !== '*') {
      const list = cors
        .split(',')
        .map((o) => o.trim().replace(/\/$/, ''))
        .filter(Boolean);
      return list.length > 0 ? list : undefined;
    }
    return undefined;
  }

  async verifyClerkToken(token: string): Promise<{ clerkUserId: string } | null> {
    if (!this.isConfigured()) return null;
    try {
      const parties = this.authorizedParties();
      const payload = await verifyToken(token, {
        secretKey: this.config.get('CLERK_SECRET_KEY')!,
        ...(parties ? { authorizedParties: parties } : {}),
      });
      return { clerkUserId: payload.sub };
    } catch (e) {
      this.logger.debug(`Clerk token inválido: ${(e as Error).message}`);
      return null;
    }
  }

  async fetchClerkUser(clerkUserId: string): Promise<ClerkUser | null> {
    if (!this.client) return null;
    try {
      return await this.client.users.getUser(clerkUserId);
    } catch {
      return null;
    }
  }

  async syncUserFromClerk(clerkUserId: string): Promise<AuthUserPayload> {
    const clerkUser = await this.fetchClerkUser(clerkUserId);
    if (!clerkUser) {
      throw new Error(`Usuario Clerk no encontrado: ${clerkUserId}`);
    }
    return this.upsertFromClerkUser(clerkUser);
  }

  async upsertFromClerkUser(clerkUser: ClerkUser): Promise<AuthUserPayload> {
    const emailAddresses = clerkUser.emailAddresses ?? [];
    const phoneNumbers = clerkUser.phoneNumbers ?? [];

    const email =
      emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
      emailAddresses[0]?.emailAddress;

    const phone =
      phoneNumbers.find((p) => p.id === clerkUser.primaryPhoneNumberId)?.phoneNumber ??
      phoneNumbers[0]?.phoneNumber;

    const meta = clerkUser.publicMetadata as { roles?: string[]; campId?: string };
    const roles = Array.isArray(meta?.roles) && meta.roles.length > 0 ? meta.roles : ['citizen'];

    const displayName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      clerkUser.username ||
      email?.split('@')[0] ||
      phone ||
      'Usuario Lefrig';

    const userData = {
      email: email ?? null,
      phone: phone ?? null,
      displayName,
      avatarUrl: clerkUser.imageUrl || null,
      roles,
      campId: meta?.campId ?? null,
      verificationLevel: phone ? 'phone' : email ? 'community' : 'unverified',
    };

    const existingByClerk = await this.prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    let user;
    if (existingByClerk) {
      user = await this.prisma.user.update({
        where: { id: existingByClerk.id },
        data: {
          email: userData.email ?? undefined,
          phone: userData.phone ?? undefined,
          displayName: userData.displayName,
          avatarUrl: userData.avatarUrl,
          roles: userData.roles,
          campId: userData.campId ?? undefined,
        },
      });
    } else if (email) {
      const emailVerified = emailAddresses.some(
        (e) => e.emailAddress === email && e.verification?.status === 'verified',
      );
      const existingByEmail = await this.prisma.user.findUnique({ where: { email } });
      if (existingByEmail && emailVerified) {
        user = await this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            clerkId: clerkUser.id,
            phone: userData.phone ?? undefined,
            displayName: userData.displayName,
            avatarUrl: userData.avatarUrl,
            roles: userData.roles,
            campId: userData.campId ?? undefined,
          },
        });
      } else if (existingByEmail && !emailVerified) {
        this.logger.warn(
          `Omitiendo link por email no verificado: ${email} → clerk ${clerkUser.id}`,
        );
        user = await this.prisma.user.create({
          data: { clerkId: clerkUser.id, ...userData, email: null },
        });
      } else {
        user = await this.prisma.user.create({
          data: { clerkId: clerkUser.id, ...userData },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: { clerkId: clerkUser.id, ...userData },
      });
    }

    return {
      sub: user.id,
      clerkId: clerkUser.id,
      phone: user.phone ?? undefined,
      email: user.email ?? undefined,
      roles: user.roles,
      campId: user.campId ?? undefined,
    };
  }

  async handleWebhookEvent(type: string, data: Record<string, unknown>) {
    if (type === 'user.created' || type === 'user.updated') {
      const id = data.id as string | undefined;
      if (!id) return;
      const clerkUser = (await this.fetchClerkUser(id)) ?? normalizeClerkUserPayload(data);
      await this.upsertFromClerkUser(clerkUser);
      this.logger.log(`Usuario sincronizado desde webhook: ${id}`);
    }
    if (type === 'user.deleted') {
      const id = data.id as string;
      if (id) {
        await this.prisma.user.updateMany({
          where: { clerkId: id },
          data: { isActive: false },
        });
      }
    }
  }

  async updateClerkRoles(clerkUserId: string, roles: string[]) {
    if (!this.client) return;
    await this.client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: { roles },
    });
  }
}
