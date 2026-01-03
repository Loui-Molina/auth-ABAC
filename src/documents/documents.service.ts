import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { WinstonLogger } from '../common/logger/winston.logger';
import { Document } from '@prisma/client';
import { CaslAbilityFactory } from '../casl/casl-ability.factory';
import { AuthUser } from 'src/auth/interfaces/auth-user.interface';
import { subject } from '@casl/ability';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLogger,
    private readonly caslAbilityFactory: CaslAbilityFactory,
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

  async findOne(id: number, requestingUser: AuthUser): Promise<Document> {
    this.logger.debug(`Fetching document with ID: ${id}`);
    const doc = await this.prisma.document.findUnique({
      where: { id },
      include: { owner: true }, // Include owner to serialize if needed
    });

    if (!doc) {
      this.logger.warn(`Document lookup failed: ID ${id}`);
      throw new NotFoundException(`Document #${id} not found`);
    }

    // 1. Create ability
    const ability = this.caslAbilityFactory.createForUser(requestingUser);

    // 2. Instance Check: Can this user read THIS document?
    if (ability.cannot('read', subject('Document', doc))) {
      this.logger.warn(
        `User ${requestingUser.id} denied access to Document ${id}`,
      );
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }

    return doc;
  }
}
