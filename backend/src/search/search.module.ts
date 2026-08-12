import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductsModule } from '../products/products.module';
import { SearchIndexService } from './search-index.service';
import { ElasticsearchSearchService } from './elasticsearch-search.service';
import { PostgresSearchService } from './postgres-search.service';
import { SearchController } from './search.controller';
import { SearchSyncService } from './search-sync.service';
import { SearchInitService } from './search-init.service';
import { SEARCH_SERVICE } from './search.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), ProductsModule],
  controllers: [SearchController],
  providers: [
    SearchIndexService,
    ElasticsearchSearchService,
    PostgresSearchService,
    SearchSyncService,
    SearchInitService,
    {
      provide: SEARCH_SERVICE,
      inject: [ConfigService, ElasticsearchSearchService, PostgresSearchService],
      useFactory: (
        config: ConfigService,
        esService: ElasticsearchSearchService,
        pgService: PostgresSearchService,
      ) => (config.get<string>('SEARCH_PROVIDER') === 'elasticsearch' ? esService : pgService),
    },
  ],
  exports: [SearchIndexService, SEARCH_SERVICE],
})
export class SearchModule {}
