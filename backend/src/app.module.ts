import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { envValidationSchema } from './config/env.validation';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { TagsModule } from './tags/tags.module';
import { ProductsModule } from './products/products.module';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';
import { SearchModule } from './search/search.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { UploadModule } from './upload/upload.module';
import { BannersModule } from './banners/banners.module';

@Module({
  imports: [
    // Make ConfigService available globally — no need to import ConfigModule in every feature module
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),

    // Rate limiting: global short (3 req/sec) and medium (100 req/min) throttle windows
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 60000, limit: 100 },
    ]),

    // Connect to PostgreSQL using values from ConfigService (never hardcode credentials)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        database: config.get<string>('DB_NAME'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        // Entities are registered via TypeOrmModule.forFeature() in each module
        autoLoadEntities: true,
        // Never auto-sync in any environment — use explicit migrations
        synchronize: false,
      }),
    }),

    // Application-level event bus (used for Elasticsearch sync, notifications, etc.)
    EventEmitterModule.forRoot(),

    ElasticsearchModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    TagsModule,
    ProductsModule,
    SearchModule,
    CartModule,
    OrdersModule,
    AdminModule,
    UploadModule,
    BannersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply ThrottlerGuard globally to all routes
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
