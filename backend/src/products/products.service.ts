import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductSpec } from './entities/product-spec.entity';
import { Variant } from './entities/variant.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto, ProductSortOption } from './dto/product-query.dto';
import { PaginatedResult } from '../common/types/index';

const PRODUCT_RELATIONS = ['category', 'images', 'specs', 'variants'];

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
    @InjectRepository(ProductSpec)
    private readonly specRepo: Repository<ProductSpec>,
    @InjectRepository(Variant)
    private readonly variantRepo: Repository<Variant>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: ProductQueryDto): Promise<PaginatedResult<Product>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // Step 1: paginate IDs only (no joins — avoids TypeORM skip/take + join bug)
    const idQb = this.productRepo
      .createQueryBuilder('product')
      .select('product.id', 'id')
      .where(query.all ? '1=1' : 'product.is_active = :isActive', { isActive: true });

    if (query.featured) {
      idQb.andWhere('product.is_featured = true');
    }

    if (query.q) {
      idQb.andWhere(
        '(product.name ILIKE :q OR product.description ILIKE :q)',
        { q: `%${query.q}%` },
      );
    }

    if (query.category) {
      idQb.leftJoin('product.category', 'category')
        .andWhere('category.slug = :categorySlug', { categorySlug: query.category });
    }

    if (query.minPrice !== undefined) {
      idQb.andWhere(
        'EXISTS (SELECT 1 FROM variants v WHERE v.product_id = product.id AND CAST(v.price AS NUMERIC) >= :minPrice)',
        { minPrice: query.minPrice },
      );
    }

    if (query.maxPrice !== undefined) {
      idQb.andWhere(
        'EXISTS (SELECT 1 FROM variants v WHERE v.product_id = product.id AND CAST(v.price AS NUMERIC) <= :maxPrice)',
        { maxPrice: query.maxPrice },
      );
    }

    switch (query.sort) {
      case ProductSortOption.PRICE_ASC:
        idQb.addSelect(
          '(SELECT MIN(CAST(v.price AS NUMERIC)) FROM variants v WHERE v.product_id = product.id)',
          'min_price',
        ).orderBy('min_price', 'ASC');
        break;
      case ProductSortOption.PRICE_DESC:
        idQb.addSelect(
          '(SELECT MIN(CAST(v.price AS NUMERIC)) FROM variants v WHERE v.product_id = product.id)',
          'min_price',
        ).orderBy('min_price', 'DESC');
        break;
      case ProductSortOption.NEWEST:
      default:
        idQb.orderBy('product.createdAt', 'DESC');
        break;
    }

    const total = await idQb.getCount();
    const rows = await idQb.offset(skip).limit(limit).getRawMany<{ id: number }>();
    const ids = rows.map(r => r.id);

    if (ids.length === 0) {
      return { data: [], total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    // Step 2: fetch full entities with relations in ID order
    const entities = await this.productRepo.find({
      where: { id: In(ids) },
      relations: PRODUCT_RELATIONS,
    });

    const idOrder = new Map(ids.map((id, i) => [id, i]));
    const data = entities.sort((a, b) => idOrder.get(a.id)! - idOrder.get(b.id)!);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { slug, isActive: true },
      relations: PRODUCT_RELATIONS,
    });
    if (!product) {
      throw new NotFoundException(`Product with slug "${slug}" not found`);
    }
    return product;
  }

  async findById(id: number): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: PRODUCT_RELATIONS,
    });
    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepo.create({
      name: dto.name,
      slug: dto.slug,
      categoryId: dto.categoryId,
      description: dto.description,
      badge: dto.badge ?? '',
      isActive: dto.isActive ?? true,
      images: dto.images?.map((img) => this.imageRepo.create(img)) ?? [],
      specs: dto.specs?.map((spec) => this.specRepo.create(spec)) ?? [],
      variants: dto.variants?.map((v) => this.variantRepo.create(v)) ?? [],
    });
    const saved = await this.productRepo.save(product);
    const full = await this.findById(saved.id);
    this.eventEmitter.emit('product.created', full);
    return full;
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findById(id);

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.slug !== undefined) product.slug = dto.slug;
    if (dto.categoryId !== undefined) product.categoryId = dto.categoryId;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.badge !== undefined) product.badge = dto.badge;
    if (dto.isActive !== undefined) product.isActive = dto.isActive;

    if (dto.images !== undefined) {
      await this.imageRepo.delete({ productId: id });
      product.images = dto.images.map((img) => this.imageRepo.create({ ...img, productId: id }));
    }

    if (dto.specs !== undefined) {
      await this.specRepo.delete({ productId: id });
      product.specs = dto.specs.map((spec) => this.specRepo.create({ ...spec, productId: id }));
    }

    if (dto.variants !== undefined) {
      await this.variantRepo.delete({ productId: id });
      product.variants = dto.variants.map((v) => this.variantRepo.create({ ...v, productId: id }));
    }

    const saved = await this.productRepo.save(product);
    const full = await this.findById(saved.id);
    this.eventEmitter.emit('product.updated', full);
    return full;
  }

  async remove(id: number): Promise<void> {
    const product = await this.findById(id);
    product.isActive = false;
    await this.productRepo.save(product);
    this.eventEmitter.emit('product.deleted', id);
  }
}
