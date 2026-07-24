import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { RedisModule } from './common/redis/redis.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { StripeModule } from './stripe/stripe.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    // Global rate limiting: 100 requests per minute for all routes
    // Auth endpoints override this with 5 requests per minute via @Throttle decorator
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds (1 minute)
        limit: 100, // 100 requests per minute - default for most routes
      },
    ]),
    RedisModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    RestaurantsModule,
    NutritionModule,
    OrdersModule,
    AdminModule,
    SuperAdminModule,
    StripeModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Applied globally to all routes
    },
  ],
})
export class AppModule {}
