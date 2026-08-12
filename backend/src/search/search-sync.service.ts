import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { SearchIndexService } from './search-index.service';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class SearchSyncService {
  private readonly logger = new Logger(SearchSyncService.name);

  constructor(
    private readonly searchIndexService: SearchIndexService,
    private readonly config: ConfigService,
  ) {}

  private get esActive(): boolean {
    return this.config.get<string>('SEARCH_PROVIDER') === 'elasticsearch';
  }

  @OnEvent('product.created')
  async onProductCreated(product: Product): Promise<void> {
    if (!this.esActive) return;
    this.logger.debug(`Indexing created product #${product.id}`);
    await this.searchIndexService.indexProduct(product);
  }

  @OnEvent('product.updated')
  async onProductUpdated(product: Product): Promise<void> {
    if (!this.esActive) return;
    this.logger.debug(`Re-indexing updated product #${product.id}`);
    await this.searchIndexService.indexProduct(product);
  }

  @OnEvent('product.deleted')
  async onProductDeleted(id: number): Promise<void> {
    if (!this.esActive) return;
    this.logger.debug(`Removing deleted product #${id} from index`);
    await this.searchIndexService.removeProduct(id);
  }
}
