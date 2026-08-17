import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreSetting } from './entities/store-setting.entity';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';

const DEFAULTS: Omit<StoreSetting, 'id' | 'updatedAt'> = {
  storeName: 'ShopVN',
  contactEmail: 'support@shopvn.vn',
  contactPhone: '1900 1234',
  bankName: 'Vietcombank',
  bankAccount: '1234567890',
  bankOwner: 'CÔNG TY SHOPVN',
  freeShippingThreshold: '500000',
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(StoreSetting)
    private readonly settingsRepo: Repository<StoreSetting>,
  ) {}

  // Always operates on the single settings row (lowest id), creating it
  // on first read if the seed migration somehow never ran.
  async get(): Promise<StoreSetting> {
    const existing = await this.settingsRepo.find({ order: { id: 'ASC' }, take: 1 });
    if (existing.length > 0) return existing[0];
    const created = this.settingsRepo.create(DEFAULTS);
    return this.settingsRepo.save(created);
  }

  async update(dto: UpdateStoreSettingsDto): Promise<StoreSetting> {
    const settings = await this.get();
    Object.assign(settings, dto);
    return this.settingsRepo.save(settings);
  }
}
