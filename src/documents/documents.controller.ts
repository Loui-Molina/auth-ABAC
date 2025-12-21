import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentEntity } from './entities/document.entity';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { RoleSerializerInterceptor } from '../common/interceptors/role-serializer.interceptor';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { subject } from '@casl/ability';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(AuthGuard)
@UseInterceptors(RoleSerializerInterceptor)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a private document' })
  @ApiResponse({ status: 201, type: DocumentEntity })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateDocumentDto,
  ): Promise<DocumentEntity> {
    if (!req.user) throw new ForbiddenException();

    const doc = await this.documentsService.create(req.user.id, dto);
    return new DocumentEntity(doc);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document (Owner Only)' })
  @ApiResponse({ status: 200, type: DocumentEntity })
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<DocumentEntity> {
    if (!req.user) throw new ForbiddenException();

    const document = await this.documentsService.findOne(+id);

    const ability = this.caslAbilityFactory.createForUser(req.user);

    if (ability.cannot('read', subject('Document', document))) {
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return new DocumentEntity(document);
  }
}
