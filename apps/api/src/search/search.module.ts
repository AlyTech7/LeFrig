import { Global, Module } from '@nestjs/common';
import { SearchIndexService } from './search-index.service';
import { GlobalSearchService } from './global-search.service';
import { SearchController } from './search.controller';

@Global()
@Module({
  controllers: [SearchController],
  providers: [SearchIndexService, GlobalSearchService],
  exports: [SearchIndexService, GlobalSearchService],
})
export class SearchModule {}
