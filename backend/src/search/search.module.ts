import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { SearchIndexService } from './search-index.service';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { SearchSyncService } from './search-sync.service';
import { SearchInitService } from './search-init.service';

@Module({
  imports: [ProductsModule],
  controllers: [SearchController],
  providers: [
    SearchIndexService,
    SearchService,
    SearchSyncService,
    SearchInitService,
  ],
  exports: [SearchIndexService, SearchService],
})
export class SearchModule {}
