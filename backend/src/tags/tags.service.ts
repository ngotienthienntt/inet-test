import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { Product } from '../products/entities/product.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepo: Repository<Tag>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(): Promise<Tag[]> {
    return this.tagRepo.find({ order: { name: 'ASC' } });
  }

  async findBySlug(slug: string): Promise<Tag> {
    const tag = await this.tagRepo.findOne({ where: { slug } });
    if (!tag) {
      throw new NotFoundException(`Tag with slug "${slug}" not found`);
    }
    return tag;
  }

  async create(dto: CreateTagDto): Promise<Tag> {
    const existing = await this.tagRepo.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" đã được sử dụng`);
    }
    const tag = this.tagRepo.create(dto);
    return this.tagRepo.save(tag);
  }

  async update(id: number, dto: UpdateTagDto): Promise<Tag> {
    const tag = await this.tagRepo.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Tag #${id} not found`);
    }
    if (dto.slug && dto.slug !== tag.slug) {
      const existing = await this.tagRepo.findOne({ where: { slug: dto.slug } });
      if (existing) {
        throw new ConflictException(`Slug "${dto.slug}" đã được sử dụng`);
      }
    }
    Object.assign(tag, dto);
    return this.tagRepo.save(tag);
  }

  async remove(id: number): Promise<void> {
    const tag = await this.tagRepo.findOne({ where: { id } });
    if (!tag) {
      throw new NotFoundException(`Tag #${id} not found`);
    }
    const productCount = await this.productRepo
      .createQueryBuilder('product')
      .innerJoin('product.tags', 'tag')
      .where('tag.id = :id', { id })
      .getCount();
    if (productCount > 0) {
      throw new BadRequestException(`Không thể xóa tag "${tag.name}" vì còn ${productCount} sản phẩm`);
    }
    await this.tagRepo.remove(tag);
  }
}
