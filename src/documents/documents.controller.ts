import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { getSerializationGroups } from '../common/serialization.utility';
import { plainToInstance } from 'class-transformer';
import { DocumentResponseDto } from './dto/document.response.dto';
import { CheckPolicies } from '../casl/policies/check.decorator';
import { PoliciesGuard } from '../casl/policies/guard';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(AuthGuard, PoliciesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a private document' })
  @ApiResponse({ status: 201, type: DocumentResponseDto })
  // 2. Static Check: Can they create documents? (Usually yes for auth users, but good to be explicit)
  @CheckPolicies((ability) => ability.can('create', 'Document'))
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateDocumentDto,
  ): Promise<DocumentResponseDto> {
    const doc = await this.documentsService.create(req.user.id, dto);

    const groups = getSerializationGroups(req.user, doc);

    return plainToInstance(DocumentResponseDto, doc, {
      excludeExtraneousValues: true,
      groups,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document (Owner Only)' })
  @ApiResponse({ status: 200, type: DocumentResponseDto })
  async findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<DocumentResponseDto> {
    const document = await this.documentsService.findOne(+id, req.user);

    const groups = getSerializationGroups(req.user, document);

    return plainToInstance(DocumentResponseDto, document, {
      excludeExtraneousValues: true,
      groups,
    });
  }
}
