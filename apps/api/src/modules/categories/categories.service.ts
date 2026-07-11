import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findAll(type?: string) {
    return this.prisma.category.findMany({
      where: { isActive: true, ...(type && { type }) },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findBySlug(slug: string) {
    return this.prisma.category.findUnique({ where: { slug } });
  }
}
