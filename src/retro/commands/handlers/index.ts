import { CreateRetroCommandHandler } from './create-retro.handler';
import { UpdateRetroCommandHandler } from './update-retro.handler';
import { UpdateRetroVoteCommandHandler } from './update-retro-vote.handler';
import { EndRetroCommandHandler } from './end-retro.handler';
import { AddFeedbackCommandHandler } from './add-feedback.handler';

export const CommandHandlers = [
  CreateRetroCommandHandler,
  UpdateRetroCommandHandler,
  UpdateRetroVoteCommandHandler,
  EndRetroCommandHandler,
  AddFeedbackCommandHandler,
];
