import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Variant } from '../../products/entities/variant.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'order_id' })
  orderId: number;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'variant_id', nullable: true })
  variantId: number;

  @ManyToOne(() => Variant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'variant_id' })
  variant: Variant;

  @Column({ name: 'product_name' })
  productName: string;

  @Column({ name: 'variant_label', nullable: true })
  variantLabel: string;

  @Column({ type: 'numeric', precision: 15, scale: 0 })
  price: number;

  @Column()
  quantity: number;

  @Column({ type: 'numeric', precision: 15, scale: 0, name: 'line_total' })
  lineTotal: number;
}
