import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  RawBodyRequest,
  Request,
  Response,
  SetMetadata,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { QueryBus, CommandBus } from '@nestjs/cqrs';
import {
  CircleAuthGuard,
  CreateCircleAuthGuard,
  ViewCircleAuthGuard,
} from 'src/auth/circle.guard';
import {
  AdminAuthGuard,
  PublicViewAuthGuard,
  SessionAuthGuard,
} from 'src/auth/iron-session.guard';
import { ObjectIdDto } from 'src/common/dtos/object-id.dto';
import {
  RequiredAutomationIdDto,
  RequiredPaymentIdDto,
  RequiredRoleDto,
  RequiredSlugDto,
} from 'src/common/dtos/string.dto';
import {
  ArchiveCircleByIdCommand,
  CreateFolderCommand,
  DeleteFolderCommand,
  UpdateFolderCommand,
  UpdateFolderOrderCommand,
  UpdateFolderDetailsCommand,
  UpgradePlanCommand,
} from './commands/impl';
import { WhitelistMemberAddressCommand } from './commands/roles/impl/whitelist-member-address.command';
import { AddSafeCommand, RemoveSafeCommand } from './commands/safe/impl';
import { CreateCircleRequestDto } from './dto/create-circle-request.dto';
import {
  BucketizedCircleResponseDto,
  DetailedCircleResponseDto,
  CircleResponseDto,
} from './dto/detailed-circle-response.dto';
import { InviteDto } from './dto/invite.dto';
import {
  JoinCircleUsingInvitationRequestDto,
  JoinMultipleCirclesUsingDiscordDto,
} from './dto/join-circle.dto';
import { MemberDto } from './dto/params.dto';
import { AddRoleDto, UpdateRoleDto } from './dto/roles-requests.dto';
import { SafeAddress } from './dto/safe-request.dto';
import {
  AddWhitelistedAddressRequestDto,
  UpdateCircleRequestDto,
  UpgradePlanDto,
  WhitelistAddressRequestDto,
} from './dto/update-circle-request.dto';
import { UpdateMemberRolesDto } from './dto/update-member-role.dto';
import { Circle } from './model/circle.model';
import {
  GetCircleNavigationBreadcrumbsQuery,
  GetCircleNavigationQuery,
} from './queries/impl';
import { CirclesRolesService } from './services/circle-roles.service';
import { CirclesCrudService } from './services/circles-crud.service';
import { CircleMembershipService } from './services/circles-membership.service';
import {
  CreateFolderDto,
  UpdateFolderDto,
  FolderParamDto,
  UpdateFolderOrderDto,
  UpdateFolderDetailsDto,
} from './dto/folder.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CirclesRepository } from './circles.repository';
import {
  MintKudosService,
  nftTypes,
} from 'src/credentials/services/mintkudos.service';
import {
  ClaimKudosDto,
  MintKudosDto,
} from 'src/credentials/dto/mint-kudos.dto';
import { ApiTags } from '@nestjs/swagger';
import { CreateAutomationDto, UpdateAutomationDto } from './dto/automation.dto';
import {
  AddAutomationCommand,
  RemoveAutomationCommand,
  UpdateAutomationCommand,
} from './commands/automation/impl';
import { CirclesCollectionService } from './services/circle-collection.service';
import { Collection } from 'src/collection/model/collection.model';
import {
  AddManualPaymentsCommand,
  AddPaymentsCommand,
  MovePaymentsCommand,
  UpdateMultiplePaymentsCommand,
  UpdatePaymentsCommand,
} from './commands/payments/impl';
import {
  AddManualPaymentRequestDto,
  AddPaymentsRequestDto,
  PaymentIdsDto,
  UpdateMultiplePaymentsDto,
  UpdatePaymentRequestDto,
} from './dto/payment.dto';
import Stripe from 'stripe';
import { CancelPlanCommand } from './commands/impl/cancel-plan.command';
import { GetUserByFilterQuery } from 'src/users/queries/impl';

@Controller('circle/v1')
@ApiTags('circle.v1')
export class CircleV1Controller {
  constructor(
    private readonly circleMembershipService: CircleMembershipService,
    private readonly circleCrudService: CirclesCrudService,
    private readonly circleRoleServie: CirclesRolesService,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly kudosService: MintKudosService,
    private readonly circleRepository: CirclesRepository,
    private readonly circleCollectionService: CirclesCollectionService,
  ) {}

  @UseGuards(PublicViewAuthGuard)
  @Get('/allPublicParents')
  async findAllParentCircles(): Promise<BucketizedCircleResponseDto> {
    try {
      return await this.circleCrudService.getPubicParentCircles();
    } catch (error) {
      console.log(error);
      return {};
    }
  }

  // @UseGuards(ViewCircleAuthGuard)
  @Post('/stripe/webhook')
  async stripeWebhook(
    @Request() request: RawBodyRequest<Request>,
    @Response() response,
  ) {
    console.log('STRIPE WEBHOOK');
    const sig = request.headers['stripe-signature'];
    let event;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripe = new Stripe(process.env.STRIPE_PVT_KEY, {
      apiVersion: '2022-11-15',
    });
    try {
      event = stripe.webhooks.constructEvent(
        request.rawBody,
        sig,
        endpointSecret,
      );
    } catch (err) {
      console.log(err);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
    console.log({ event });
    let subscription;
    let circle: Circle;
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('CHECKOUT SESSION COMPLETED');
        const session = await stripe.checkout.sessions.retrieve(
          event.data.object.id,
          {
            expand: ['line_items'],
          },
        );
        console.log({ session: session.client_reference_id });
        const membersTopUp = session.line_items.data[1]?.quantity;
        circle =
          await this.circleRepository.updateCircleAndReturnWithPopulatedReferences(
            session.client_reference_id,
            {
              pricingPlan: 1,
              topUpMembers: membersTopUp || 0,
              subscriptionId: session.subscription,
            },
          );
        console.log({ circle: circle.name, referrer: circle.referredBy });

        let referrer = '';
        if (circle.referredBy) {
          const referrerUser = await this.queryBus.execute(
            new GetUserByFilterQuery({
              referralCode: circle.referredBy,
            }),
          );
          console.log({ referrerUser });
          referrer = referrerUser?.username;
        }

        fetch(`${process.env.DISCORD_URI}/api/notifySubscription`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            circleName: circle.name,
            members: membersTopUp || 0,
            referredBy: referrer,
          }),
        });

        break;
      case 'customer.subscription.deleted':
        console.log('CUSTOMER SUBSCRIPTION DELETED');
        subscription = event.data.object;
        circle = await this.circleRepository.findOne({
          subscriptionId: subscription.id,
        });
        await this.circleRepository.updateCircleAndReturnWithPopulatedReferences(
          circle.id,
          {
            pricingPlan: 0,
            topUpMembers: 0,
            subscriptionId: '',
          },
        );

        fetch(`${process.env.DISCORD_URI}/api/notifySubscriptionDeleted`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            circleName: circle.name,
          }),
        });

        break;
      case 'invoice.paid':
        console.log('INVOICE PAID');
        const invoice = event.data.object;
        subscription = invoice.subscription;
        circle = await this.circleRepository.findOne({
          subscriptionId: subscription,
        });
        console.log({
          circle: circle.pendingBonus,
          invoice: invoice.amount_paid,
          added: invoice.amount_paid * 0.01 * 0.2,
        });
        await this.circleRepository.updateCircleAndReturnWithPopulatedReferences(
          circle.id,
          {
            pendingBonus:
              (circle.pendingBonus || 0) + invoice.amount_paid * 0.01 * 0.2,
            monthsOfSubscription: (circle.monthsOfSubscription || 0) + 1,
          },
        );

        fetch(`${process.env.DISCORD_URI}/api/notifyInvoice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            circleName: circle.name,
            amount: invoice.amount_paid * 0.01,
            failure: false,
          }),
        });

        break;
      case 'invoice.payment_failed':
        console.log('INVOICE PAYMENT FAILED');
        const invoicePaymentFailed = event.data.object;
        subscription = invoicePaymentFailed.subscription;
        circle = await this.circleRepository.findOne({
          subscriptionId: subscription,
        });
        fetch(`${process.env.DISCORD_URI}/api/notifyInvoice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            circleName: circle.name,
            amount: invoice.amount_paid * 0.01,
            failure: true,
          }),
        });
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }

  @UseGuards(PublicViewAuthGuard)
  @UseGuards(AdminAuthGuard)
  @Get('/totalKudosDesigns')
  async totalKudosDesigns(): Promise<number> {
    const res = await this.kudosService.getAllDesigns();
    return res.length;
  }

  @UseGuards(AdminAuthGuard)
  @Get('/allKudosDesigns')
  async allKudosDesigns(): Promise<nftTypes[]> {
    return await this.kudosService.getAllDesigns();
  }

  @UseGuards(AdminAuthGuard)
  @Get('removeFirstUserAddedKudosDesign')
  async removeKudosDesigns(): Promise<nftTypes> {
    return await this.kudosService.removeFirstUserAddedKudosDesign();
  }

  @UseGuards(ViewCircleAuthGuard)
  @Get('/:id')
  async findByObjectId(
    @Param() param: ObjectIdDto,
  ): Promise<CircleResponseDto> {
    return await this.circleCrudService.getById(param.id);
  }

  @UseGuards(ViewCircleAuthGuard)
  @Get('/slug/:slug')
  async findBySlug(
    @Param() param: RequiredSlugDto,
  ): Promise<CircleResponseDto> {
    return await this.circleCrudService.getBySlug(param.slug);
  }

  @UseGuards(PublicViewAuthGuard)
  @Get('/:id/allActiveCollections')
  async findAllActiveCollections(
    @Param() param: ObjectIdDto,
  ): Promise<Collection[]> {
    try {
      return await this.circleCollectionService.getAllCollections(param.id);
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  @UseGuards(CreateCircleAuthGuard)
  @Post('/')
  async create(
    @Body() circle: CreateCircleRequestDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.circleCrudService.create(circle);
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id')
  async update(
    @Param() param: ObjectIdDto,
    @Body() updateCircleRequestDto: UpdateCircleRequestDto,
  ): Promise<CircleResponseDto> {
    return await this.circleCrudService.update(
      param.id,
      updateCircleRequestDto,
    );
  }

  @SetMetadata('permissions', ['inviteMembers'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/invite')
  async invite(
    @Param() param: ObjectIdDto,
    @Body() invitation: InviteDto,
  ): Promise<string> {
    return await this.circleMembershipService.invite(param.id, invitation);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/joinUsingInvitation')
  async joinUsingInvitation(
    @Param() param: ObjectIdDto,
    @Body() joinDto: JoinCircleUsingInvitationRequestDto,
  ): Promise<CircleResponseDto> {
    return await this.circleMembershipService.joinUsingInvitation(
      param.id,
      joinDto,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/joinUsingDiscord')
  async joinUsingDiscord(
    @Param() param: ObjectIdDto,
  ): Promise<CircleResponseDto> {
    return await this.circleMembershipService.joinUsingDiscord(param.id);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/joinUsingGuildxyz')
  async joinUsingGuildxyz(
    @Param() param: ObjectIdDto,
  ): Promise<CircleResponseDto> {
    return await this.circleMembershipService.joinUsingGuildxyz(param.id);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/joinMultipleCirclesUsingGuildxyz')
  async joinMultipleCirclesUsingGuildxyz(
    @Param() param: { id: string },
  ): Promise<void> {
    return await this.circleMembershipService.joinMultipleCirclesUsingGuildxyz(
      param.id,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/joinMultipleCirclesUsingDiscord')
  async joinMultipleCirclesUsingDiscord(
    @Param() param: { id: string },
    @Body() joinDto: JoinMultipleCirclesUsingDiscordDto,
  ): Promise<void> {
    return await this.circleMembershipService.joinMultipleCirclesUsingDiscord(
      joinDto,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/join')
  async join(@Param() param: ObjectIdDto): Promise<CircleResponseDto> {
    return await this.circleMembershipService.join(param.id);
  }

  @SetMetadata('permissions', ['manageMembers'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/updateMemberRoles')
  async updateMemberRoles(
    @Param() param: ObjectIdDto,
    @Query() memberDto: MemberDto,
    @Body() updateMemberRolesDto: UpdateMemberRolesDto,
  ): Promise<CircleResponseDto> {
    return await this.circleMembershipService.updateMemberRoles(
      param.id,
      memberDto.member,
      updateMemberRolesDto,
    );
  }

  @SetMetadata('permissions', ['manageMembers'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/removeMember')
  async removeMember(
    @Param() param: ObjectIdDto,
    @Query() memberDto: MemberDto,
  ): Promise<CircleResponseDto> {
    return await this.circleMembershipService.updateMemberRoles(
      param.id,
      memberDto.member,
      {
        roles: ['__removed__'],
      },
      true,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('/:id/leave')
  async leave(
    @Param() param: ObjectIdDto,
    @Request() request,
  ): Promise<CircleResponseDto> {
    return await this.circleMembershipService.updateMemberRoles(
      param.id,
      request.user.id,
      {
        roles: ['__left__'],
      },
      true,
    );
  }

  @SetMetadata('permissions', ['manageRoles'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/addRole')
  async addRole(
    @Param() param: ObjectIdDto,
    @Body() addRoleDto: AddRoleDto,
  ): Promise<CircleResponseDto> {
    return await this.circleRoleServie.addRole(param.id, addRoleDto);
  }

  @SetMetadata('permissions', ['manageRoles'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/updateRole')
  async updateRole(
    @Param() param: ObjectIdDto,
    @Query() roleParam: RequiredRoleDto,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<CircleResponseDto> {
    return await this.circleRoleServie.updateRole(
      param.id,
      roleParam.role,
      updateRoleDto,
    );
  }

  @SetMetadata('permissions', ['manageRoles'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/removeRole')
  async removeRole(
    @Param() param: ObjectIdDto,
    @Query() roleParam: RequiredRoleDto,
  ): Promise<CircleResponseDto> {
    return await this.circleRoleServie.removeRole(param.id, roleParam.role);
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/folder/add')
  async createFolder(
    @Param() param: ObjectIdDto,
    @Body() addFolderDto: CreateFolderDto,
  ): Promise<CircleResponseDto> {
    return await this.commandBus.execute(
      new CreateFolderCommand(param.id, addFolderDto),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/folder/:folderId/update')
  async updateFolder(
    @Param() param: ObjectIdDto,
    @Param() folderParam: FolderParamDto,
    @Body() updateFolderDto: UpdateFolderDto,
  ): Promise<CircleResponseDto> {
    return await this.commandBus.execute(
      new UpdateFolderCommand(param.id, folderParam.folderId, updateFolderDto),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/folderDetails')
  async updateFolderDetails(
    @Param() param: ObjectIdDto,
    @Body() updateFolderDetailsDto: UpdateFolderDetailsDto,
  ): Promise<CircleResponseDto> {
    return await this.commandBus.execute(
      new UpdateFolderDetailsCommand(param.id, updateFolderDetailsDto),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/folderOrder')
  async updateFolderOrder(
    @Param() param: ObjectIdDto,
    @Body() updateFolderOrderDto: UpdateFolderOrderDto,
  ): Promise<CircleResponseDto> {
    return await this.commandBus.execute(
      new UpdateFolderOrderCommand(param.id, updateFolderOrderDto),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/folder/:folderId/delete')
  async deleteFolder(
    @Param() param: ObjectIdDto,
    @Param() folderParam: FolderParamDto,
  ): Promise<CircleResponseDto> {
    return await this.commandBus.execute(
      new DeleteFolderCommand(param.id, folderParam.folderId),
    );
  }

  @SetMetadata('permissions', ['managePaymentOptions'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/addSafe')
  async addSafe(
    @Param() param: ObjectIdDto,
    @Body() safeDto: SafeAddress,
  ): Promise<DetailedCircleResponseDto> {
    return await this.commandBus.execute(
      new AddSafeCommand(safeDto, null, param.id),
    );
  }

  @SetMetadata('permissions', ['managePaymentOptions'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/removeSafe')
  async removeSafe(
    @Param() param: ObjectIdDto,
    @Body() safeDto: SafeAddress,
  ): Promise<DetailedCircleResponseDto> {
    return await this.commandBus.execute(
      new RemoveSafeCommand(safeDto, null, param.id),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/archive')
  async archive(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.commandBus.execute(
      new ArchiveCircleByIdCommand(param.id),
    );
  }

  @Get('/:id/circleNav')
  async circleNav(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.queryBus.execute(new GetCircleNavigationQuery(param.id));
  }

  @Get('/:id/circleNavBreadcrumbs')
  async circleNavBreadcumbs(
    @Param() param: ObjectIdDto,
  ): Promise<DetailedCircleResponseDto> {
    return await this.queryBus.execute(
      new GetCircleNavigationBreadcrumbsQuery(param.id),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/mintKudos')
  async mintKudos(
    @Param() param: ObjectIdDto,
    @Body() mintKudosDto: MintKudosDto,
  ): Promise<object> {
    return {
      operationId: await this.kudosService.mintKudos(param.id, mintKudosDto),
    };
  }

  @Patch('/:id/claimKudos')
  async claimKudos(
    @Param() param: ObjectIdDto,
    @Body() claimKudosDto: ClaimKudosDto,
  ): Promise<object> {
    return {
      operationId: await this.kudosService.claimKudos(param.id, claimKudosDto),
    };
  }

  @Get('/:id/communityKudosDesigns')
  async communityKudosDesigns(@Param() param: ObjectIdDto): Promise<nftTypes> {
    return await this.kudosService.getCommunityKudosDesigns(param.id);
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/addKudosDesign')
  @UseInterceptors(FileInterceptor('file'))
  async addKudosDesign(@Param() param: ObjectIdDto, @UploadedFile() file) {
    return await this.kudosService.addNewCommunityDesign(param.id, file);
  }

  @SetMetadata('permissions', ['manageMembers', 'manageRoles'])
  @Patch('/:id/addWhitelistedAddress')
  async addWhitelistedAddress(
    @Param() param: ObjectIdDto,
    @Body() addWhitelistedAddressDto: AddWhitelistedAddressRequestDto,
  ): Promise<Circle> {
    return await this.commandBus.execute(
      new WhitelistMemberAddressCommand(
        addWhitelistedAddressDto.ethAddress,
        addWhitelistedAddressDto.roles,
        null,
        param.id,
      ),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/addAutomation')
  async addAutomation(
    @Param() param: ObjectIdDto,
    @Body() addAutomationDto: CreateAutomationDto,
  ) {
    return await this.commandBus.execute(
      new AddAutomationCommand(param.id, addAutomationDto),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/updateAutomation')
  async updateAutomation(
    @Param() param: ObjectIdDto,
    @Query() query: RequiredAutomationIdDto,
    @Body() updateAutomationDto: UpdateAutomationDto,
  ) {
    return await this.commandBus.execute(
      new UpdateAutomationCommand(
        param.id,
        query.automationId,
        updateAutomationDto,
      ),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/removeAutomation')
  async removeAutomation(
    @Param() param: ObjectIdDto,
    @Query() query: RequiredAutomationIdDto,
  ) {
    return await this.commandBus.execute(
      new RemoveAutomationCommand(param.id, query.automationId),
    );
  }

  @SetMetadata('permissions', ['managePaymentOptions'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/addPendingPayment')
  async addPendingPayment(
    @Param() param: ObjectIdDto,
    @Body() addPaymentsRequestDto: AddPaymentsRequestDto,
    @Request() request,
  ): Promise<DetailedCircleResponseDto> {
    return await this.commandBus.execute(
      new AddPaymentsCommand(param.id, addPaymentsRequestDto, request.user),
    );
  }

  @SetMetadata('permissions', ['managePaymentOptions'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/updatePayment')
  async updatePayment(
    @Param() param: ObjectIdDto,
    @Body() updatePaymentsRequestDto: UpdatePaymentRequestDto,
    @Query() query: RequiredPaymentIdDto,
    @Request() request,
  ): Promise<DetailedCircleResponseDto> {
    return await this.commandBus.execute(
      new UpdatePaymentsCommand(
        param.id,
        query.paymentId,
        updatePaymentsRequestDto,
        request.user,
      ),
    );
  }

  @SetMetadata('permissions', ['managePaymentOptions'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/updateMultiplePayments')
  async updateMultiplePayments(
    @Param() param: ObjectIdDto,
    @Body() updateMultiplePaymentsRequestDto: UpdateMultiplePaymentsDto,
    @Request() request,
  ): Promise<DetailedCircleResponseDto> {
    return await this.commandBus.execute(
      new UpdateMultiplePaymentsCommand(
        param.id,
        updateMultiplePaymentsRequestDto.paymentIds,
        updateMultiplePaymentsRequestDto,
        request.user,
      ),
    );
  }

  @SetMetadata('permissions', ['managePaymentOptions'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/addManualPayment')
  async addPayment(
    @Param() param: ObjectIdDto,
    @Body() addManualPaymentDto: AddManualPaymentRequestDto,
    @Request() request,
  ): Promise<DetailedCircleResponseDto> {
    return await this.commandBus.execute(
      new AddManualPaymentsCommand(param.id, addManualPaymentDto, request.user),
    );
  }

  @SetMetadata('permissions', ['makePayment'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/makePayments')
  async makePayments(
    @Param() param: ObjectIdDto,
    @Body() makePaymentsRequestDto: PaymentIdsDto,
    @Request() request,
  ): Promise<DetailedCircleResponseDto> {
    return await this.commandBus.execute(
      new MovePaymentsCommand(
        param.id,
        {
          ...makePaymentsRequestDto,
          from: 'pending',
          to: 'completed',
        },
        request.user,
        makePaymentsRequestDto.transactionHash,
      ),
    );
  }

  @SetMetadata('permissions', ['makePayment', 'managePaymentOptions'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/cancelPayments')
  async cancelPayments(
    @Param() param: ObjectIdDto,
    @Body() makePaymentsRequestDto: PaymentIdsDto,
    @Request() request,
  ): Promise<DetailedCircleResponseDto> {
    return await this.commandBus.execute(
      new MovePaymentsCommand(
        param.id,
        {
          ...makePaymentsRequestDto,
          from: 'pending',
          to: 'cancelled',
        },
        request.user,
      ),
    );
  }

  @SetMetadata('permissions', ['managePaymentOptions'])
  @UseGuards(CircleAuthGuard)
  @Patch('/:id/whitelistAddresses')
  async updateWhitelistedAddresses(
    @Param() param: ObjectIdDto,
    @Body() updateCircleRequestDto: WhitelistAddressRequestDto,
  ): Promise<CircleResponseDto> {
    return await this.circleCrudService.update(
      param.id,
      updateCircleRequestDto,
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Post('/:id/upgradePlan')
  async upgradePlan(
    @Param() param: ObjectIdDto,
    @Body() upgradePlanDto: UpgradePlanDto,
    @Request() request,
  ) {
    return await this.commandBus.execute(
      new UpgradePlanCommand(upgradePlanDto, param.id, request.user),
    );
  }

  @SetMetadata('permissions', ['manageCircleSettings'])
  @UseGuards(CircleAuthGuard)
  @Post('/:id/cancelPlan')
  async cancelPlan(@Param() param: ObjectIdDto, @Request() request) {
    return await this.commandBus.execute(
      new CancelPlanCommand(param.id, request.user),
    );
  }
}
