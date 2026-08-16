import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './entities/banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private readonly bannerRepo: Repository<Banner>,
  ) {}

  async findAll(): Promise<Banner[]> {
    return this.bannerRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findActive(position: string): Promise<Banner | null> {
    return this.bannerRepo.findOne({ where: { position, isActive: true } });
  }

  async create(dto: CreateBannerDto): Promise<Banner> {
    if (dto.isActive !== false) {
      await this.deactivateSiblings(dto.position);
    }
    const banner = this.bannerRepo.create(dto);
    return this.bannerRepo.save(banner);
  }

  async update(id: number, dto: UpdateBannerDto): Promise<Banner> {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner #${id} not found`);
    }
    const willBeActive = dto.isActive ?? banner.isActive;
    if (willBeActive) {
      await this.deactivateSiblings(dto.position ?? banner.position);
    }
    Object.assign(banner, dto);
    return this.bannerRepo.save(banner);
  }

  async remove(id: number): Promise<void> {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) {
      throw new NotFoundException(`Banner #${id} not found`);
    }
    await this.bannerRepo.remove(banner);
  }

  private async deactivateSiblings(position: string): Promise<void> {
    await this.bannerRepo.update({ position, isActive: true }, { isActive: false });
  }
}
