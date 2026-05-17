import "reflect-metadata";
//Работа декораторов

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { existsSync } from "fs";
import { join } from "path";

import {
  json,
  static as serveStatic,
  urlencoded,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { AppModule } from "./app.module";

//Запуск приложения (async потому что подключение к БД, портам - нужно время)
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  //просим nest создать экземпляр приложения предоставляя корневой метод
  //await потому что ждем пока nestfactory всё соберет

  app.use(json({ limit: "1mb" }));
  app.use(urlencoded({ extended: true, limit: "1mb" }));

  const playerImagesPath =
    process.env.PLAYER_IMAGE_CACHE_DIR ??
    join(process.cwd(), "public", "player-images");
  const frontendDistPath =
    process.env.FRONTEND_DIST_PATH ?? join(process.cwd(), "public", "app");
  const frontendIndexPath = join(frontendDistPath, "index.html");

  app.use("/player-images", serveStatic(playerImagesPath));

  if (existsSync(frontendIndexPath)) {
    app.use(serveStatic(frontendDistPath, { index: false }));

    const expressApp = app.getHttpAdapter().getInstance();

    expressApp.get(
      "*",
      (request: Request, response: Response, next: NextFunction) => {
        if (
          request.path.startsWith("/api") ||
          request.path.startsWith("/player-images")
        ) {
          next();

          return;
        }

        response.sendFile(frontendIndexPath);
      },
    );
  }

  const corsOrigins = (
    process.env.CORS_ORIGIN ??
    process.env.FRONTEND_ORIGIN ??
    "http://localhost:5173,http://127.0.0.1:5173"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const localDevOriginPattern =
    /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+):\d+$/;

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (
        !origin ||
        corsOrigins.includes(origin) ||
        localDevOriginPattern.test(origin)
      ) {
        callback(null, true);

        return;
      }

      callback(null, false);
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.setGlobalPrefix("api"); // endpoints begins with api
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true, //если пришла строка то нест сам преобразует
      forbidNonWhitelisted: true, //выдаст ошибку если придут данные не DTO которые ожидаются
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("Squad Draft API")
    .setDescription("API documentation for Squad Draft backend")
    .setVersion("1.0")
    .addTag("auth")
    .addTag("draft")
    .addTag("users")
    .addTag("health")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);

  console.log(`Backend is running on http://localhost:${port}/api`);
  console.log(
    `Swagger docs are available at http://localhost:${port}/api/docs`,
  );
}

bootstrap();
