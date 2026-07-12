import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageAdapter } from '../../adapters/storage.adapter';
import { paginate, skipTake } from '../../common/utils/pagination';
import { paginationSchema } from '@lefrig/shared';

@Injectable()
export class CommunityService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageAdapter,
  ) {}

  async findAll(query: unknown) {
    const { page, limit } = paginationSchema.parse(query);
    const { skip, take } = skipTake(page, limit);
    const q = query as Record<string, string>;

    const where = {
      ...(q.campId && { campId: q.campId }),
      ...(q.postType && { postType: q.postType }),
    };

    const [data, total] = await Promise.all([
      this.prisma.communityPost.findMany({
        where,
        skip,
        take,
        include: {
          author: { select: { displayName: true, avatarUrl: true } },
          camp: { select: { nameEs: true, slug: true } },
        },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.communityPost.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  create(authorId: string, data: {
    campId: string;
    postType: string;
    title: string;
    content: string;
    images?: string[];
  }) {
    if (data.images?.length) {
      this.storage.assertOwnedImageUrls(data.images, authorId);
    }
    return this.prisma.communityPost.create({
      data: { authorId, ...data, images: data.images ?? [] },
      include: { camp: true },
    });
  }
}
