import { Inject, Injectable, Logger } from '@nestjs/common';
import { Client } from '@elastic/elasticsearch';
import type { Sort } from '@elastic/elasticsearch/lib/api/types';
import { SearchQueryDto } from './dto/search-query.dto';
import { ProductDocument } from './search-index.service';
import { ELASTICSEARCH_CLIENT } from '../elasticsearch/elasticsearch.module';
import { PaginatedResult } from '../common/types/index';

const INDEX = 'products';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @Inject(ELASTICSEARCH_CLIENT)
    private readonly esClient: Client,
  ) {}

  async search(dto: SearchQueryDto): Promise<PaginatedResult<ProductDocument>> {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 20, 100);
    const from = (page - 1) * limit;

    const must: object[] = dto.q
      ? [
          {
            multi_match: {
              query: dto.q,
              fields: ['name^3', 'description^1'],
            },
          },
        ]
      : [{ match_all: {} }];

    const filter: object[] = [{ term: { isActive: true } }];

    if (dto.category) {
      const slugs = dto.category.split(',').map((s) => s.trim()).filter(Boolean);
      if (slugs.length) {
        filter.push({ terms: { categorySlug: slugs } });
      }
    }

    if (dto.minPrice !== undefined) {
      filter.push({ range: { minPrice: { gte: dto.minPrice } } });
    }

    if (dto.maxPrice !== undefined) {
      filter.push({ range: { maxPrice: { lte: dto.maxPrice } } });
    }

    let sort: Sort;
    switch (dto.sort) {
      case 'price_asc':
        sort = [{ minPrice: { order: 'asc' } }];
        break;
      case 'price_desc':
        sort = [{ maxPrice: { order: 'desc' } }];
        break;
      case 'newest':
        sort = [{ createdAt: { order: 'desc' } }];
        break;
      case 'relevance':
      default:
        sort = [{ _score: { order: 'desc' } }];
        break;
    }

    try {
      const response = await this.esClient.search<ProductDocument>({
        index: INDEX,
        from,
        size: limit,
        query: {
          bool: {
            must,
            filter,
          },
        },
        sort,
      });

      const hits = response.hits.hits;
      const total =
        typeof response.hits.total === 'number'
          ? response.hits.total
          : (response.hits.total?.value ?? 0);

      const data = hits
        .map((hit) => hit._source)
        .filter((source): source is ProductDocument => source !== undefined);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (err) {
      this.logger.warn(`Elasticsearch search failed: ${(err as Error).message}`);
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  async suggestions(q: string): Promise<Pick<ProductDocument, 'id' | 'name' | 'category'>[]> {
    try {
      const response = await this.esClient.search<ProductDocument>({
        index: INDEX,
        size: 6,
        timeout: '200ms',
        _source: ['id', 'name', 'category'],
        query: {
          multi_match: {
            query: q,
            fields: ['name.keyword', 'name'],
            type: 'phrase_prefix',
          },
        },
      });

      return response.hits.hits
        .map((hit) => hit._source)
        .filter(
          (source): source is ProductDocument => source !== undefined,
        )
        .map(({ id, name, category }) => ({ id, name, category }));
    } catch (err) {
      this.logger.warn(`Elasticsearch suggestions failed: ${(err as Error).message}`);
      return [];
    }
  }
}
