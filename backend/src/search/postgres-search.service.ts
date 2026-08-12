import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { SearchQueryDto } from './dto/search-query.dto';
import { ProductDocument, toProductDocument } from './product-document.mapper';
import { ISearchService } from './search.interface';
import { PaginatedResult } from '../common/types/index';

const PRODUCT_RELATIONS = ['category', 'images', 'specs', 'variants'];

@Injectable()
export class PostgresSearchService implements ISearchService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async search(dto: SearchQueryDto): Promise<PaginatedResult<ProductDocument>> {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const idQb = this.productRepo
      .createQueryBuilder('product')
      .select('product.id', 'id')
      .where('product.is_active = :isActive', { isActive: true });

    if (dto.q) {
      idQb.andWhere(
        '(product.name ILIKE :q OR product.description ILIKE :q)',
        { q: `%${dto.q}%` },
      );
    }

    if (dto.category) {
      const slugs = dto.category.split(',').map((s) => s.trim()).filter(Boolean);
      if (slugs.length) {
        idQb.leftJoin('product.category', 'category')
          .andWhere('category.slug IN (:...slugs)', { slugs });
      }
    }

    if (dto.minPrice !== undefined) {
      idQb.andWhere(
        'EXISTS (SELECT 1 FROM variants v WHERE v.product_id = product.id AND CAST(v.price AS NUMERIC) >= :minPrice)',
        { minPrice: dto.minPrice },
      );
    }

    if (dto.maxPrice !== undefined) {
      idQb.andWhere(
        'EXISTS (SELECT 1 FROM variants v WHERE v.product_id = product.id AND CAST(v.price AS NUMERIC) <= :maxPrice)',
        { maxPrice: dto.maxPrice },
      );
    }

    switch (dto.sort) {
      case 'price_asc':
        idQb
          .addSelect(
            '(SELECT MIN(CAST(v.price AS NUMERIC)) FROM variants v WHERE v.product_id = product.id)',
            'min_price',
          )
          .orderBy('min_price', 'ASC');
        break;
      case 'price_desc':
        idQb
          .addSelect(
            '(SELECT MIN(CAST(v.price AS NUMERIC)) FROM variants v WHERE v.product_id = product.id)',
            'min_price',
          )
          .orderBy('min_price', 'DESC');
        break;
      case 'newest':
      case 'relevance':
      default:
        // ILIKE has no relevance score, so "relevance" falls back to newest-first.
        idQb.orderBy('product.createdAt', 'DESC');
        break;
    }

    const total = await idQb.getCount();
    const rows = await idQb.offset(skip).limit(limit).getRawMany<{ id: number }>();
    const ids = rows.map((r) => r.id);

    if (ids.length === 0) {
      return { data: [], total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    const entities = await this.productRepo.find({
      where: { id: In(ids) },
      relations: PRODUCT_RELATIONS,
    });

    const idOrder = new Map(ids.map((id, i) => [id, i]));
    const data = entities
      .sort((a, b) => idOrder.get(a.id)! - idOrder.get(b.id)!)
      .map(toProductDocument);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async suggestions(q: string): Promise<Pick<ProductDocument, 'id' | 'name' | 'category'>[]> {
    if (!q) {
      return [];
    }

    const products = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.is_active = true')
      .andWhere('product.name ILIKE :q', { q: `${q}%` })
      .orderBy('product.name', 'ASC')
      .limit(6)
      .getMany();

    return products.map((p) => ({ id: p.id, name: p.name, category: p.category?.name ?? '' }));
  }
}
