import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersService } from './orders.service';
import { CheckoutService } from './checkout.service';
import { OrdersController } from './orders.controller';
import { CheckoutController } from './checkout.controller';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    CartModule,
  ],
  controllers: [CheckoutController, OrdersController],
  providers: [OrdersService, CheckoutService],
  exports: [OrdersService, CheckoutService],
})
export class OrdersModule {}
