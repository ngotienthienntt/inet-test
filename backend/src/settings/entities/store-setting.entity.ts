import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

// Singleton row — the app always reads/writes the single row with the
// lowest id (seeded by the migration). No admin UI to create more rows.
@Entity('store_settings')
export class StoreSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'store_name' })
  storeName: string;

  @Column({ name: 'contact_email' })
  contactEmail: string;

  @Column({ name: 'contact_phone' })
  contactPhone: string;

  @Column({ name: 'bank_name' })
  bankName: string;

  @Column({ name: 'bank_account' })
  bankAccount: string;

  @Column({ name: 'bank_owner' })
  bankOwner: string;

  @Column({ name: 'free_shipping_threshold' })
  freeShippingThreshold: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
