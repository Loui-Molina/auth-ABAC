import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { WinstonLogger } from '../common/logger/winston.logger';
import { Document } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLogger,
  ) {}

  async create(userId: number, dto: CreateDocumentDto): Promise<Document> {
    this.logger.log(`User ${userId} creating document: ${dto.title}`);
    return this.prisma.document.create({
      data: {
        title: dto.title,
        content: dto.content,
        ownerId: userId,
      },
    });
  }

  async findOne(id: number): Promise<Document> {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) {
      this.logger.warn(`Document lookup failed: ID ${id}`);
      throw new NotFoundException(`Document #${id} not found`);
    }
    return doc;
  }
}
