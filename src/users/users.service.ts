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

  /**
   *
   * @param mappedDiff Difference between two cards in terms of stakeholders being added or removed
   * @returns
   *
   * Find all stakeholders that are added or removed from a card and return their user objects
   */
  async findStakeholders(mappedDiff: MappedDiff) {
    let userIds = [];
    for (const [cardId, cardDiff] of Object.entries(mappedDiff)) {
      const stakeholders = (cardDiff.added.assignee || [])
        .concat(cardDiff.deleted.assignee || [])
        .concat(cardDiff.added.reviewer || [])
        .concat(cardDiff.deleted.reviewer || []);
      userIds = [...userIds, ...stakeholders];
    }
    if (userIds.length === 0) return [];
    const users = await this.usersRepository.findAll({
      _id: { $in: userIds },
    });
    return users;
  }

  addCardToUsers(
    mappedUsers: MappedUser,
    stakeholders: string[],
    key: string,
    userToCards: MappedUser,
    cardId: string,
  ) {
    for (const userId of stakeholders) {
      if (!userToCards[userId])
        userToCards[userId] = {
          assignedCards: [],
          reviewingCards: [],
        };
      if (!mappedUsers[userId][key]) mappedUsers[userId][key] = [];
      userToCards[userId] = {
        ...userToCards[userId],
        [key]: mappedUsers[userId][key]
          .map((x) => x.toString())
          .includes(cardId)
          ? mappedUsers[userId][key]
          : [...mappedUsers[userId][key], cardId],
      };
    }
    return userToCards;
  }

  removeCardFromUsers(
    mappedUsers: MappedUser,
    stakeholders: string[],
    key: string,
    userToCards: MappedUser,
    cardId: string,
  ) {
    for (const userId of stakeholders) {
      if (!userToCards[userId])
        userToCards[userId] = {
          assignedCards: [],
          reviewingCards: [],
        };
      if (!mappedUsers[userId][key]) mappedUsers[userId][key] = [];

      userToCards[userId] = {
        ...userToCards[userId],
        [key]: mappedUsers[userId][key].filter((x) => x.toString() !== cardId),
      };
    }
    return userToCards;
  }

  async updateUserCards(mappedDiff: MappedDiff): Promise<MappedUser> {
    try {
      const userToCards = {};
      const users = await this.findStakeholders(mappedDiff);
      const mappedUsers = this.commonTools.objectify(users, 'id');

      for (const [cardId, cardDiff] of Object.entries(mappedDiff)) {
        const addedAssignees = cardDiff.added.assignee || [];
        const removedAssignees = cardDiff.deleted.assignee || [];
        const addedReviewers = cardDiff.added.reviewer || [];
        const removedReviewers = cardDiff.deleted.reviewer || [];

        this.addCardToUsers(
          mappedUsers,
          addedAssignees,
          'assignedCards',
          userToCards,
          cardId,
        );
        this.removeCardFromUsers(
          mappedUsers,
          removedAssignees,
          'assignedCards',
          userToCards,
          cardId,
        );
        this.addCardToUsers(
          mappedUsers,
          addedReviewers,
          'reviewingCards',
          userToCards,
          cardId,
        );
        this.removeCardFromUsers(
          mappedUsers,
          removedReviewers,
          'reviewingCards',
          userToCards,
          cardId,
        );
      }
      return userToCards;
    } catch (error) {
      console.log(error);
      return {};
    }
  }
}
