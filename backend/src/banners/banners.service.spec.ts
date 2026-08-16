import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BannersService } from './banners.service';
import { Banner } from './entities/banner.entity';
import { BannerPosition } from './banner-position.enum';

const mockBanner = (overrides: Partial<Banner> = {}): Banner =>
  ({
    id: 1,
    position: BannerPosition.HOMEPAGE_BEFORE_CATEGORIES,
    imageUrl: 'http://localhost:3001/uploads/products/banner.jpg',
    linkUrl: 'http://localhost:3000/shop?category=dien-thoai',
    altText: 'Banner khuyến mãi',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Banner;

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
});

describe('BannersService', () => {
  let service: BannersService;
  let repo: jest.Mocked<Repository<Banner>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BannersService,
        { provide: getRepositoryToken(Banner), useFactory: mockRepo },
      ],
    }).compile();

    service = module.get<BannersService>(BannersService);
    repo = module.get(getRepositoryToken(Banner));
  });

  describe('findAll', () => {
    it('returns all banners newest first', async () => {
      const banners = [mockBanner()];
      repo.find.mockResolvedValue(banners);

      const result = await service.findAll();

      expect(result).toBe(banners);
      expect(repo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    });
  });

  describe('findActive', () => {
    it('returns the active banner for a position', async () => {
      const banner = mockBanner();
      repo.findOne.mockResolvedValue(banner);

      const result = await service.findActive(BannerPosition.HOMEPAGE_BEFORE_CATEGORIES);

      expect(result).toBe(banner);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { position: BannerPosition.HOMEPAGE_BEFORE_CATEGORIES, isActive: true },
      });
    });

    it('returns null when no banner is active for that position', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.findActive(BannerPosition.HOMEPAGE_BEFORE_CATEGORIES);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('deactivates other active banners in the same position before inserting an active one', async () => {
      const dto = {
        position: BannerPosition.HOMEPAGE_BEFORE_CATEGORIES,
        imageUrl: 'http://x/banner.jpg',
        altText: 'Alt',
        isActive: true,
      };
      const created = mockBanner();
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(repo.update).toHaveBeenCalledWith(
        { position: BannerPosition.HOMEPAGE_BEFORE_CATEGORIES, isActive: true },
        { isActive: false },
      );
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });

    it('does not deactivate siblings when creating an inactive banner', async () => {
      const dto = {
        position: BannerPosition.HOMEPAGE_BEFORE_CATEGORIES,
        imageUrl: 'http://x/banner.jpg',
        altText: 'Alt',
        isActive: false,
      };
      const created = mockBanner({ isActive: false });
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      await service.create(dto);

      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the banner does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update(99, { altText: 'x' })).rejects.toThrow(NotFoundException);
    });

    it('deactivates siblings when activating a banner', async () => {
      const existing = mockBanner({ isActive: false });
      repo.findOne.mockResolvedValue(existing);
      repo.save.mockResolvedValue({ ...existing, isActive: true });

      await service.update(1, { isActive: true });

      expect(repo.update).toHaveBeenCalledWith(
        { position: existing.position, isActive: true },
        { isActive: false },
      );
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the banner does not exist', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('removes the banner when it exists', async () => {
      const existing = mockBanner();
      repo.findOne.mockResolvedValue(existing);

      await service.remove(1);

      expect(repo.remove).toHaveBeenCalledWith(existing);
    });
  });
});
