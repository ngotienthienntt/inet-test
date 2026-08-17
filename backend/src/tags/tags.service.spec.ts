import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagsService } from './tags.service';
import { Tag } from './entities/tag.entity';
import { Product } from '../products/entities/product.entity';

const mockTag = (overrides: Partial<Tag> = {}): Tag =>
  ({ id: 1, name: 'Sinh viên', slug: 'sinh-vien', createdAt: new Date(), ...overrides }) as Tag;

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('TagsService', () => {
  let service: TagsService;
  let tagRepo: jest.Mocked<Repository<Tag>>;
  let productRepo: jest.Mocked<Repository<Product>>;
  let qb: { innerJoin: jest.Mock; where: jest.Mock; getCount: jest.Mock };

  beforeEach(async () => {
    qb = { innerJoin: jest.fn().mockReturnThis(), where: jest.fn().mockReturnThis(), getCount: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TagsService,
        { provide: getRepositoryToken(Tag), useFactory: mockRepo },
        {
          provide: getRepositoryToken(Product),
          useValue: { createQueryBuilder: jest.fn().mockReturnValue(qb) },
        },
      ],
    }).compile();

    service = module.get(TagsService);
    tagRepo = module.get(getRepositoryToken(Tag));
    productRepo = module.get(getRepositoryToken(Product));
  });

  describe('create', () => {
    it('throws ConflictException when slug is already used', async () => {
      tagRepo.findOne.mockResolvedValue(mockTag());
      await expect(service.create({ name: 'X', slug: 'sinh-vien' })).rejects.toThrow(ConflictException);
    });

    it('creates the tag when slug is free', async () => {
      const created = mockTag();
      tagRepo.findOne.mockResolvedValue(null);
      tagRepo.create.mockReturnValue(created);
      tagRepo.save.mockResolvedValue(created);
      const result = await service.create({ name: 'Sinh viên', slug: 'sinh-vien' });
      expect(result).toBe(created);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException when the tag does not exist', async () => {
      tagRepo.findOne.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when products still reference the tag', async () => {
      tagRepo.findOne.mockResolvedValue(mockTag());
      qb.getCount.mockResolvedValue(2);
      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      expect(productRepo.createQueryBuilder).toHaveBeenCalledWith('product');
    });

    it('removes the tag when no product references it', async () => {
      const tag = mockTag();
      tagRepo.findOne.mockResolvedValue(tag);
      qb.getCount.mockResolvedValue(0);
      await service.remove(1);
      expect(tagRepo.remove).toHaveBeenCalledWith(tag);
    });
  });
});
