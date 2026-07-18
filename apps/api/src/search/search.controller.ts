import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GlobalSearchService } from './global-search.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private search: GlobalSearchService) {}

  @Get()
  searchAll(
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    const n = Math.min(Math.max(Number(limit) || 8, 1), 20);
    return this.search.searchAll(q ?? '', n);
  }
}
