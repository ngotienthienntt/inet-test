import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SearchIndexService } from './search-index.service';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class SearchSyncService {
  private readonly logger = new Logger(SearchSyncService.name);

  constructor(private readonly searchIndexService: SearchIndexService) {}

  @OnEvent('product.created')
  async onProductCreated(product: Product): Promise<void> {
    this.logger.debug(`Indexing created product #${product.id}`);
    await this.searchIndexService.indexProduct(product);
  }

  @OnEvent('product.updated')
  async onProductUpdated(product: Product): Promise<void> {
    this.logger.debug(`Re-indexing updated product #${product.id}`);
    await this.searchIndexService.indexProduct(product);
  }

  @OnEvent('product.deleted')
  async onProductDeleted(id: number): Promise<void> {
    this.logger.debug(`Removing deleted product #${id} from index`);
    await this.searchIndexService.removeProduct(id);
  }
}
