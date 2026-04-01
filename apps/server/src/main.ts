import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { createAppRouter } from './trpc/trpc.router';
import { createContext } from './trpc/trpc.context';
import { SupabaseService } from './supabase/supabase.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
  });

  const supabaseService = app.get(SupabaseService);
  const appRouter = createAppRouter(supabaseService);

  app.use(
    '/trpc',
    createExpressMiddleware({ router: appRouter, createContext }),
  );

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Server running on port ${process.env.PORT ?? 3001}`);
}

bootstrap();
