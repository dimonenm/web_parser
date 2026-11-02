import { Controller, Get, Query } from '@nestjs/common'
import { InstagramService } from './instagram.service'

@Controller('instagram')
export class InstagramController {
  constructor(private readonly instagramService: InstagramService) {}

  @Get('get_posts_status')
  getPostsStatus() {
    return this.instagramService.getPostsStatus();
  }

  @Get('get_all_posts_from_gallary')
  async getAllPostsFromGallary(@Query('id') id: string) {
    return this.instagramService.getAllPostsFromGallary(id);
  }

  @Get('get_all_downloaded_posts')
  async getAllDownloadedPosts() {
    return this.instagramService.getAllDownloadedPosts();
  }
}
