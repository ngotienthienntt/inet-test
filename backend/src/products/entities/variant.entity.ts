import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('variants')
export class Variant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'product_id' })
  productId: number;

  @ManyToOne(() => Product, (p) => p.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ nullable: true })
  size: string;

  @Column({ name: 'color_name', nullable: true })
  colorName: string;

  @Column({ name: 'color_hex', nullable: true })
  colorHex: string;

  @Column({ type: 'numeric', precision: 15, scale: 0 })
  price: number;

  @Column({ type: 'numeric', precision: 15, scale: 0, name: 'original_price' })
  originalPrice: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ nullable: true, unique: true })
  sku: string;
}
