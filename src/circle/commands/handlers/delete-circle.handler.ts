import { InternalServerErrorException } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CirclesRepository } from 'src/circle/circles.repository';
import { DeleteCircleByIdCommand } from 'src/circle/commands/impl';
import { RemoveItemsCommand } from 'src/project/commands/items/impl/remove-items.command';

@CommandHandler(DeleteCircleByIdCommand)
export class DeleteCircleByIdCommandHandler
  implements ICommandHandler<DeleteCircleByIdCommand>
{
  constructor(
    private readonly circlesRepository: CirclesRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: DeleteCircleByIdCommand): Promise<boolean> {
    try {
      let circleToDelete = command.circle;
      if (!circleToDelete) {
        circleToDelete = await this.circlesRepository.findById(command.id);
      }
      if (!circleToDelete) {
        throw new InternalServerErrorException(
          `Could not find circle with id ${command.id}`,
        );
      }
      for (const project of circleToDelete.projects) {
        this.commandBus.execute(
          new RemoveItemsCommand(
            [
              {
                itemIds: [circleToDelete.id],
                fieldName: 'parents',
              },
            ],
            null,
            project.toString(),
          ),
        );
      }
      await this.circlesRepository.deleteOne({
        _id: command.id,
      });
      return true;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
