import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InstagramModule } from './instagram/instagram.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    InstagramModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
