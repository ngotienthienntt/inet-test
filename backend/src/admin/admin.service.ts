import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { UserRole } from '../common/types/index';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
  ) {}

  async getStats() {
    const [totalUsers, totalOrders, totalProducts, totalGuests] = await Promise.all([
      this.userRepository.count({ where: { role: UserRole.CUSTOMER } }),
      this.orderRepository.count(),
      this.productRepository.count(),
      this.orderRepository
        .createQueryBuilder('order')
        .select('COUNT(DISTINCT order.session_token)', 'count')
        .where('order.user_id IS NULL')
        .andWhere('order.session_token IS NOT NULL')
        .getRawOne<{ count: string }>()
        .then(r => Number(r?.count ?? 0)),
    ]);

    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .getRawOne<{ total: string | null }>();

    const totalRevenue = Number(revenueResult?.total ?? 0);

    const recentOrders = await this.orderRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
      relations: ['items'],
    });

    return { totalUsers, totalOrders, totalProducts, totalGuests, totalRevenue, recentOrders };
  }

  async getCustomers(search?: string, page = 1, limit = 20) {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.CUSTOMER });

    if (search) {
      qb.andWhere('(user.fullName ILIKE :s OR user.email ILIKE :s)', { s: `%${search}%` });
    }

    const [users, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data: users.map((u) => this.sanitize(u)), total, page, limit };
  }

  async getCustomer(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Customer not found');
    return this.sanitize(user);
  }

  async toggleBan(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Customer not found');
    user.isActive = !user.isActive;
    await this.userRepository.save(user);
    return this.sanitize(user);
  }

  private sanitize(user: User) {
    const { passwordHash: _, ...rest } = user as User & { passwordHash?: string };
    return rest;
  }
}
