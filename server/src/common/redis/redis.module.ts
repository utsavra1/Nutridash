import { Module, Global, Logger } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

const logger = new Logger('RedisModule');

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => {
        const redisUrl = process.env.REDIS_URL;

        // If no REDIS_URL is set, fall back to in-memory cache (free tier safe)
        if (!redisUrl) {
          logger.warn(
            '⚠️  REDIS_URL not set — using in-memory cache (data lost on restart)',
          );
          return { ttl: 60000 }; // in-memory, 60s TTL
        }

        try {
          const store = await redisStore({ url: redisUrl });
          logger.log('✅ Redis connected: ' + redisUrl.split('@').pop());
          return { store };
        } catch (err) {
          logger.warn(
            '⚠️  Redis connection failed, falling back to in-memory cache: ' +
              err.message,
          );
          return { ttl: 60000 }; // fallback
        }
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisModule {}
