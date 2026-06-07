import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SearchIndexService } from './search-index.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class SearchInitService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SearchInitService.name);

  constructor(
    private readonly searchIndexService: SearchIndexService,
    private readonly productsService: ProductsService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.searchIndexService.ensureIndex();

      const count = await this.searchIndexService.countDocuments();
      if (count === 0) {
        this.logger.log('Elasticsearch index is empty — triggering full reindex');
        const result = await this.productsService.findAll({ page: 1, limit: 10000 });
        await this.searchIndexService.reindexAll(result.data);
      } else {
        this.logger.log(`Elasticsearch index already has ${count} documents — skipping reindex`);
      }
    } catch (err) {
      this.logger.warn(
        `Search init failed (app will continue without ES): ${(err as Error).message}`,
      );
    }
  }
}
