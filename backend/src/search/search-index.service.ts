import { Inject, Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import { Product } from '../products/entities/product.entity';
import { ELASTICSEARCH_CLIENT } from '../elasticsearch/elasticsearch.module';
import { toProductDocument } from './product-document.mapper';

const INDEX = 'products';

@Injectable()
export class SearchIndexService {
  private readonly logger = new Logger(SearchIndexService.name);

  constructor(
    @Inject(ELASTICSEARCH_CLIENT)
    private readonly esClient: Client,
  ) {}

  async ensureIndex(): Promise<void> {
    try {
      const exists = await this.esClient.indices.exists({ index: INDEX });
      if (exists) {
        return;
      }

      await this.esClient.indices.create({
        index: INDEX,
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
        },
        mappings: {
          properties: {
            id: { type: 'integer' },
            name: {
              type: 'text',
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' },
              },
            },
            description: { type: 'text', analyzer: 'standard' },
            category: { type: 'keyword' },
            categorySlug: { type: 'keyword' },
            badge: { type: 'keyword' },
            isActive: { type: 'boolean' },
            images: { type: 'keyword' },
            variants: {
              type: 'nested',
              properties: {
                size: { type: 'keyword' },
                colorName: { type: 'keyword' },
                price: { type: 'double' },
                originalPrice: { type: 'double' },
                stock: { type: 'integer' },
              },
            },
            minPrice: { type: 'double' },
            maxPrice: { type: 'double' },
            createdAt: { type: 'date' },
          },
        },
      });

      this.logger.log(`Index "${INDEX}" created successfully`);
    } catch (err) {
      this.logger.warn(`Failed to ensure Elasticsearch index: ${(err as Error).message}`);
    }
  }

  async indexProduct(product: Product): Promise<void> {
    try {
      const doc = toProductDocument(product);
      await this.esClient.index({
        index: INDEX,
        id: String(product.id),
        document: doc,
      });
    } catch (err) {
      this.logger.warn(`Failed to index product #${product.id}: ${(err as Error).message}`);
    }
  }

  async removeProduct(id: number): Promise<void> {
    try {
      await this.esClient.delete({
        index: INDEX,
        id: String(id),
      });
    } catch (err) {
      this.logger.warn(`Failed to remove product #${id} from index: ${(err as Error).message}`);
    }
  }

  async reindexAll(products: Product[]): Promise<void> {
    if (!products.length) {
      return;
    }

    try {
      const operations = products.flatMap((product) => [
        { index: { _index: INDEX, _id: String(product.id) } },
        toProductDocument(product),
      ]);

      const result = await this.esClient.bulk({ operations, refresh: true });

      if (result.errors) {
        const failed = result.items.filter((item) => item.index?.error).length;
        this.logger.warn(`Bulk reindex completed with ${failed} errors`);
      } else {
        this.logger.log(`Bulk reindex completed: ${products.length} products indexed`);
      }
    } catch (err) {
      this.logger.warn(`Failed to bulk reindex products: ${(err as Error).message}`);
    }
  }

  async countDocuments(): Promise<number> {
    try {
      const result = await this.esClient.count({ index: INDEX });
      return result.count;
    } catch {
      return 0;
    }
  }
}
