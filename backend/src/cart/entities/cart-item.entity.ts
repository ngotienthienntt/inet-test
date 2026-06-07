import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Variant } from '../../products/entities/variant.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'cart_id' })
  cartId: number;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @Column({ name: 'variant_id' })
  variantId: number;

  @ManyToOne(() => Variant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variant: Variant;

  @Column({ default: 1 })
  quantity: number;

  @Column({ name: 'saved_for_later', default: false })
  savedForLater: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
