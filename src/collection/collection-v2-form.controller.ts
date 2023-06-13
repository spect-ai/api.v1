import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { StrongerCollectionAuthGuard } from 'src/auth/collection.guard';
import { RequiredSlugDto } from 'src/common/dtos/string.dto';
import { LoggingService } from 'src/logging/logging.service';
import { GetCollectionBySlugQuery } from './queries';
import { PublicViewAuthGuard } from 'src/auth/iron-session.guard';
import { GitcoinPassportService } from 'src/credentials/services/gitcoin-passport.service';
import { GitcoinPassportMinimalStamp } from 'src/credentials/types/types';
import { CollectionRepository } from './collection.repository';
import { DuplicateFormCommand } from './commands/v2/impl/duplicate-collection.command';

/**
 Built with keeping integratoors in mind, this API is meant to
    1. Simplify responses for integrators
    2. Reduce the payload size of large responses & group similar data together (which we will later use to optimize requests from our frontend)
    3. Implement limit, offset and pagination for large responses
    4. Reduce number of lines in controller code
 **/

@Controller('collection/v2/form')
@ApiTags('collection.v2')
export class CollectionV2FormController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly logger: LoggingService,
    private readonly gitcoinPassportService: GitcoinPassportService,
    private readonly collectionRepository: CollectionRepository,
  ) {
    this.logger.setContext(CollectionV2FormController.name);
  }

  @SetMetadata('permissions', ['manageSettings'])
  @UseGuards(StrongerCollectionAuthGuard)
  @Get('/slug/:slug/responderProfilePlugin')
  async getResponderProfilePlugin(
    @Param() param: RequiredSlugDto,
  ): Promise<any> {
    return await this.queryBus.execute(
      new GetCollectionBySlugQuery(
        param.slug,
        {},
        {
          'formMetadata.lookup': 1,
        },
      ),
    );
  }

  @UseGuards(PublicViewAuthGuard)
  @Get('/slug/:slug/gitcoinPassportScoreAndStamps')
  async getGitcoinPassportScoreByEthAddress(
    @Param() param: RequiredSlugDto,
    @Req() req: any,
  ): Promise<{
    score: number;
    stamps: GitcoinPassportMinimalStamp[];
  }> {
    try {
      const form = await this.collectionRepository.findOne({
        slug: param.slug,
      });
      return await this.gitcoinPassportService.getScoreByEthAddress(
        req.user?.ethAddress,
        form.formMetadata.sybilProtectionScores,
        true,
      );
    } catch (e) {
      this.logger.error(
        `Error getting gitcoin passport score and stamps for ${
          req.user?.ethAddress
        } for ${param.slug} with error ${e?.message || e}`,
      );
      throw e;
    }
  }

  @SetMetadata('permissions', ['createNewForm'])
  @UseGuards(StrongerCollectionAuthGuard)
  @Post('/slug/:slug/duplicate')
  async duplicateForm(
    @Param() param: RequiredSlugDto,
    @Req() req: any,
  ): Promise<any> {
    return await this.commandBus.execute(
      new DuplicateFormCommand(param.slug, req.user),
    );
  }
}