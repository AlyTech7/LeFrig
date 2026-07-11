import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UploadsService } from './uploads.service';

const storage = memoryStorage();

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  @Post('images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage, limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadOne(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: { sub: string }) {
    return this.uploadsService.saveListingImage(file, user.sub);
  }

  @Post('images/batch')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 8, { storage, limits: { fileSize: 5 * 1024 * 1024 } }))
  uploadMany(@UploadedFiles() files: Express.Multer.File[], @CurrentUser() user: { sub: string }) {
    return this.uploadsService.saveListingImages(files, user.sub);
  }
}
