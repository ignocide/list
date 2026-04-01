import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SupabaseModule } from './supabase/supabase.module';
import { JwtMiddleware } from './auth/jwt.middleware';

@Module({
  imports: [SupabaseModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes('*');
  }
}
