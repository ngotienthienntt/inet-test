import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(includeInactive = false): Promise<Category[]> {
    const where: Record<string, unknown> = { parentId: null as any };
    if (!includeInactive) where.isActive = true;

    const parents = await this.categoryRepo.find({
      relations: ['children'],
      where,
      order: { isActive: 'DESC', sortOrder: 'ASC', name: 'ASC' },
    });

    if (!includeInactive) {
      for (const p of parents) {
        p.children = p.children.filter(c => c.isActive);
      }
    } else {
      for (const p of parents) {
        p.children = p.children.sort((a, b) =>
          Number(b.isActive) - Number(a.isActive) || a.name.localeCompare(b.name),
        );
      }
    }

    return parents;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { slug },
      relations: ['children'],
    });
    if (!category) {
      throw new NotFoundException(`Category with slug "${slug}" not found`);
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" đã được sử dụng`);
    }
    const category = this.categoryRepo.create(dto);
    return this.categoryRepo.save(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }
    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoryRepo.findOne({ where: { slug: dto.slug } });
      if (existing) {
        throw new ConflictException(`Slug "${dto.slug}" đã được sử dụng`);
      }
    }
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }
    const productCount = await this.productRepo.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new BadRequestException(`Không thể xóa danh mục "${category.name}" vì còn ${productCount} sản phẩm`);
    }
    await this.categoryRepo.remove(category);
  }
}
