import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ObjectId } from 'mongoose';
import { CreateCardRequestDto } from 'src/card/dto/create-card-request.dto';
import { Card } from 'src/card/model/card.model';
import { Diff, MappedCard, MappedDiff } from 'src/card/types/types';
import { CommonTools } from 'src/common/common.service';
import { EthAddressRepository } from 'src/_eth-address/_eth_address.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { DetailedUserPubliceResponseDto } from './dto/detailed-user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './model/users.model';
import { MappedUser } from './types/types';
import { RequestProvider } from './user.provider';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly ethAddressRepository: EthAddressRepository,
    private readonly usersRepository: UsersRepository,
    private readonly requestProvider: RequestProvider,
    private readonly commonTools: CommonTools,
  ) {}

  async getUserPublicProfile(
    userId: string,
  ): Promise<DetailedUserPubliceResponseDto> {
    return await this.usersRepository.getUserDetailsByUserId(userId);
  }

  async getPublicProfileOfMultipleUsers(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) return [];
    return await this.usersRepository.findAll({
      _id: { $in: userIds },
    });
  }

  async getUserPublicProfileByUsername(
    username: string,
  ): Promise<DetailedUserPubliceResponseDto> {
    return await this.usersRepository.getUserDetailsByUsername(username);
  }

  async create(ethAddress: string) {
    const numUsers = await this.usersRepository.count();
    const user = await this.usersRepository.create({
      username: `fren${numUsers}`,
      ethAddress: ethAddress,
    });
    await this.ethAddressRepository.create({
      ethAddress: ethAddress,
      user: user._id,
    });
    return user;
  }

  async update(updateUserDto: UpdateUserDto): Promise<User> {
    try {
      if (
        updateUserDto.username &&
        this.requestProvider.user.username !== updateUserDto.username
      ) {
        const usernameTaken = await this.usersRepository.exists({
          username: updateUserDto.username,
        });
        if (usernameTaken) throw new Error('Username taken');
      }
      return await this.usersRepository.updateById(
        this.requestProvider.user.id,
        updateUserDto,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed user update',
        error.message,
      );
    }
  }

  async findStakeholders(mappedDiff: MappedDiff) {
    let userIds = [];
    for (const [cardId, cardDiff] of Object.entries(mappedDiff)) {
      const stakeholders = (cardDiff.added.assignee || [])
        .concat(cardDiff.deleted.assignee || [])
        .concat(cardDiff.added.reviewer || [])
        .concat(cardDiff.deleted.reviewer || []);
      userIds = [...userIds, ...stakeholders];
    }
    const users = await this.usersRepository.findAll({
      _id: { $in: userIds },
    });
    return users;
  }

  async updateUserCards(mappedDiff: MappedDiff): Promise<MappedUser> {
    const userToCards = {};
    const users = await this.findStakeholders(mappedDiff);
    const mappedUsers = this.commonTools.objectify(users, 'id');

    for (const [cardId, cardDiff] of Object.entries(mappedDiff)) {
      const addedAssignees = cardDiff.added.assignee || [];
      const removedAssignees = cardDiff.deleted.assignee || [];
      const addedReviewers = cardDiff.added.reviewer || [];
      const removedReviewers = cardDiff.deleted.reviewer || [];

      for (const userId of addedAssignees) {
        if (!userToCards[userId]) userToCards[userId] = {};
        if (!mappedUsers[userId].assignedCards)
          mappedUsers[userId].assignedCards = [];
        userToCards[userId] = {
          ...userToCards[userId],
          assignedCards: mappedUsers[userId].assignedCards
            .map((x) => x.toString())
            .includes(cardId)
            ? mappedUsers[userId].assignedCards
            : [...mappedUsers[userId].assignedCards, cardId],
        };
      }

      for (const userId of removedAssignees) {
        if (!userToCards[userId]) userToCards[userId] = {};
        if (!mappedUsers[userId].assignedCards)
          mappedUsers[userId].assignedCards = [];

        userToCards[userId] = {
          ...userToCards[userId],
          assignedCards: mappedUsers[userId].assignedCards.filter(
            (x) => x.toString() !== cardId,
          ),
        };
      }

      for (const userId of addedReviewers) {
        if (!userToCards[userId]) userToCards[userId] = {};
        if (!mappedUsers[userId].reviewingCards)
          mappedUsers[userId].reviewingCards = [];

        userToCards[userId] = {
          ...userToCards[userId],
          reviewingCards: mappedUsers[userId].reviewingCards
            .map((x) => x.toString())
            .includes(cardId)
            ? mappedUsers[userId].reviewingCards
            : [...mappedUsers[userId].reviewingCards, cardId],
        };
      }

      for (const userId of removedReviewers) {
        if (!userToCards[userId]) userToCards[userId] = {};
        if (!mappedUsers[userId].reviewingCards)
          mappedUsers[userId].reviewingCards = [];

        userToCards[userId] = {
          ...userToCards[userId],
          reviewingCards: mappedUsers[userId].reviewingCards.filter(
            (x) => x.toString() !== cardId,
          ),
        };
      }
    }
    return userToCards;
  }
}
