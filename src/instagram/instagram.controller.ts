import { Controller, Get, Param, Query } from '@nestjs/common'
import { InstagramService } from './instagram.service'

@Controller('instagram')
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get('get_all_pics')
  async getAllPics(@Query('id') id: string) {
    return this.instagramService.getAllPics(id);
  }

  @Get('get_all_short_codes')
  async getAllShortCodes(@Query('id') id: string) {
    return this.instagramService.getAllShortCodes(id);
  }
  @Get('get_pic_by_short_code')
  async getPicByShortCode(
    @Query('type') type: string,
    @Query('shortCode') shortCode: string,
  ) {
    return this.instagramService.getPicByShortCode(type, shortCode);
  }

  @Get('download_all_pics')
  async downloadAllPics(@Query('fileName') fileName: string) {
    return this.instagramService.downloadAllPics(fileName);
  }

  @Get('start_get_all_short_codes_v2')
  async startGetAllShortCodesV2(@Query('id') id: string) {
    return this.instagramService.startGetAllShortCodesV2(id);
  }
  @Get('start_get_all_posts')
  async startGetAllPosts(@Query('id') id: string) {
    return this.instagramService.startGetAllPosts(id);
  }
  @Get('get_short_codes_status')
  getShortCodesStatus() {
    return this.instagramService.getShortCodesStatus();
  }
  @Get('get_posts_status')
  getPostsStatus() {
    return this.instagramService.getPostsStatus();
  }
  @Get('get_short_codes_file')
  async getShortCodesFile(@Query('id') id: string) {
    return this.instagramService.getShortCodesFile(id);
  }
}
