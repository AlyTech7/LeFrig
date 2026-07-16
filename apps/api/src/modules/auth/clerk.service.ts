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

  async verifyClerkToken(token: string): Promise<{ clerkUserId: string } | null> {
    if (!this.isConfigured()) return null;
    try {
      const payload = await verifyToken(token, {
        secretKey: this.config.get('CLERK_SECRET_KEY')!,
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
    const email =
      clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress;

    const phone =
      clerkUser.phoneNumbers.find((p) => p.id === clerkUser.primaryPhoneNumberId)?.phoneNumber ??
      clerkUser.phoneNumbers[0]?.phoneNumber;

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
      avatarUrl: clerkUser.imageUrl,
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
      const existingByEmail = await this.prisma.user.findUnique({ where: { email } });
      if (existingByEmail) {
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
      const clerkUser = data as unknown as ClerkUser;
      if (clerkUser?.id) {
        await this.upsertFromClerkUser(clerkUser);
        this.logger.log(`Usuario sincronizado desde webhook: ${clerkUser.id}`);
      }
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
