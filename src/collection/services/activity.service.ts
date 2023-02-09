import { Injectable } from '@nestjs/common';
import { CommonTools } from 'src/common/common.service';
import { v4 as uuidv4 } from 'uuid';
import { Collection } from '../model/collection.model';
import { Activity, Ref } from '../types/types';
import { detailedDiff as objectDiff } from 'deep-object-diff';
import { Diff, MappedItem } from 'src/common/interfaces';
import { QueryBus } from '@nestjs/cqrs';
import {
  GetCircleByFilterQuery,
  GetMultipleCirclesQuery,
} from 'src/circle/queries/impl';
import { GetMultipleUsersByIdsQuery } from 'src/users/queries/impl';
import { GetMultipleCollectionsQuery } from '../queries';

@Injectable()
export class ActivityResolver {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commonTools: CommonTools,
  ) {}

  async resolveAll(dataActivities: MappedItem<MappedItem<Activity>>) {
    if (!dataActivities) return {};
    for (const [dataSlug, activityObj] of Object.entries(dataActivities)) {
      dataActivities[dataSlug] = await this.resolve(activityObj);
    }
    return dataActivities;
  }

  async resolve(activityObj: MappedItem<Activity>) {
    if (!activityObj) return {};

    const keysToLookup = {} as { [activityId: string]: string[] };
    for (const [activityId, activity] of Object.entries(activityObj)) {
      if (activity.comment) continue;

      const newContentTxt = activity.content?.split('{{');
      for (let i = 1; i < newContentTxt.length; i++) {
        keysToLookup[activityId] = [
          ...(keysToLookup[activityId] || []),
          newContentTxt[i].split('}}')[0],
        ];
      }
    }

    const idsGroupedByRefType = {} as { [refType: string]: string[] };
    for (const [activityId, keys] of Object.entries(keysToLookup)) {
      for (const k of keys)
        if (activityObj[activityId].ref[k])
          idsGroupedByRefType[activityObj[activityId].ref[k].refType] = [
            ...(idsGroupedByRefType[activityObj[activityId].ref[k].refType] ||
              []),
            activityObj[activityId].ref[k].id,
          ];
    }

    const circles = await this.queryBus.execute(
      new GetMultipleCirclesQuery({
        _id: { $in: idsGroupedByRefType['circle'] },
      }),
    );

    const users = await this.queryBus.execute(
      new GetMultipleUsersByIdsQuery(idsGroupedByRefType['user']),
    );
    const collections = await this.queryBus.execute(
      new GetMultipleCollectionsQuery({
        _id: { $in: idsGroupedByRefType['collection'] },
      }),
    );
    const mappedCircles = this.commonTools.objectify(circles, 'id');
    const mappedUsers = this.commonTools.objectify(users, 'id');
    const mappedCollection = this.commonTools.objectify(collections, 'id');
    for (const [activityId, keys] of Object.entries(keysToLookup)) {
      for (const k of keys) {
        const refType = activityObj[activityId].ref[k].refType;
        const id = activityObj[activityId].ref[k].id;

        const val =
          refType === 'user'
            ? mappedUsers[id]?.username
            : refType === 'circle'
            ? mappedCircles[id].name
            : mappedCollection[id]?.name;

        const imageRef =
          refType === 'user'
            ? mappedUsers[id]?.avatar
            : refType === 'circle'
            ? mappedCircles[id].avatar
            : null;

        activityObj[activityId].content = activityObj[
          activityId
        ].content?.replace(`{{${k}}}`, val);
        if (imageRef) activityObj[activityId].imageRef = imageRef;
      }
    }

    return activityObj;
  }
}

@Injectable()
export class ActivityBuilder {
  constructor(private readonly commonTools: CommonTools) {}

  build(
    dataUpdateObj: object,
    collection: Collection,
    dataSlug: string,
    caller: string,
  ): {
    dataActivities: MappedItem<MappedItem<Activity>>;
    dataActivityOrder: MappedItem<string[]>;
  } {
    const existingData = {};
    for (const [propertyId, data] of Object.entries(
      collection.data[dataSlug],
    )) {
      if (propertyId in dataUpdateObj) {
        existingData[propertyId] = data;
      }
    }
    const diff = objectDiff(existingData, dataUpdateObj);

    const activities = this.getActivities(
      dataUpdateObj,
      collection,
      diff as Diff<any>,
      caller,
    );
    const dataActivities = {};
    const dataActivityOrder = [];
    for (const activity of activities) {
      const activityId = uuidv4();
      dataActivityOrder.push(activityId);
      dataActivities[activityId] = activity;
    }
    return {
      dataActivities: {
        ...(collection.dataActivities || {}),
        [dataSlug]: {
          ...(collection.dataActivities[dataSlug] || {}),
          ...dataActivities,
        },
      },
      dataActivityOrder: {
        ...(collection.dataActivityOrder || {}),
        [dataSlug]: [
          ...(collection.dataActivityOrder[dataSlug] || []),
          ...dataActivityOrder,
        ],
      },
    };
  }

  getActivities(
    dataUpdateObj: object,
    collection: Collection,
    diff: Diff<any>,
    caller: string,
  ): Activity[] {
    const activities = [] as Activity[];
    const timestamp = new Date();
    for (const [propertyId, data] of Object.entries(dataUpdateObj)) {
      if (propertyId === '__cardStatus__') {
        const { content, ref } = this.cardStatusActivity(
          propertyId,
          data,
          collection,
          diff,
          caller,
        );
        if (content)
          activities.push({
            content,
            ref,
            timestamp,
            comment: false,
            imageRef: `Card Status Update`,
          });
        break;
      }

      if (
        [
          'shortText',
          'ethAddress',
          'number',
          'email',
          'singleURL',
          'multiURL',
        ].includes(collection.properties[propertyId].type)
      ) {
        const { content, ref } = this.simpleFieldActivity(
          propertyId,
          data,
          collection,
          diff,
          caller,
        );
        if (content)
          activities.push({
            content,
            ref,
            timestamp,
            comment: false,
            imageRef: `${collection.properties[propertyId].type}Update`,
          });
      }
      if (['longText'].includes(collection.properties[propertyId].type)) {
        const { content, ref } = this.longTextActivity(
          propertyId,
          data,
          collection,
          diff,
          caller,
        );
        if (content)
          activities.push({
            content,
            ref,
            timestamp,
            comment: false,
            imageRef: `${collection.properties[propertyId].type}Update`,
          });
      }

      if (['date'].includes(collection.properties[propertyId].type)) {
        const { content, ref } = this.dateFieldActivity(
          propertyId,
          data,
          collection,
          diff,
          caller,
        );
        if (content)
          activities.push({
            content,
            ref,
            timestamp,
            comment: false,
            imageRef: `${collection.properties[propertyId].type}Update`,
          });
      }

      if (['user'].includes(collection.properties[propertyId].type)) {
        const { content, ref } = this.singleUserFieldActivity(
          propertyId,
          data,
          collection,
          diff,
          caller,
        );
        if (content)
          activities.push({
            content,
            ref,
            timestamp,
            comment: false,
            imageRef: `${collection.properties[propertyId].type}Update`,
          });
      }

      if (collection.properties[propertyId].type === 'user[]') {
        const { content, ref } = this.multiUserFieldActivity(
          propertyId,
          data,
          collection,
          diff,
          caller,
        );
        if (content)
          activities.push({
            content,
            ref,
            timestamp,
            comment: false,
            imageRef: `${collection.properties[propertyId].type}Update`,
          });
      }
      if (['singleSelect'].includes(collection.properties[propertyId].type)) {
        const { content, ref } = this.singleSelectFieldActivity(
          propertyId,
          data,
          collection,
          diff,
          caller,
        );
        if (content)
          activities.push({
            content,
            ref,
            timestamp,
            comment: false,
            imageRef: `${collection.properties[propertyId].type}Update`,
          });
      }
      if (['multiSelect'].includes(collection.properties[propertyId].type)) {
        const { content, ref } = this.multiSelectFieldActivity(
          propertyId,
          data,
          collection,
          diff,
          caller,
        );
        if (content)
          activities.push({
            content,
            ref,
            timestamp,
            comment: false,
            imageRef: `${collection.properties[propertyId].type}Update`,
          });
      }
      if (['reward'].includes(collection.properties[propertyId].type)) {
        const { content, ref } = this.rewardFieldActivity(
          propertyId,
          data,
          collection,
          diff,
          caller,
        );
        if (content)
          activities.push({
            content,
            ref,
            timestamp,
            comment: false,
            imageRef: `${collection.properties[propertyId].type}Update`,
          });
      }
      if (['milestone'].includes(collection.properties[propertyId].type)) {
        const { content, ref } = this.milestoneFieldActivity(
          propertyId,
          data,
          collection,
          diff,
          caller,
        );
        if (content)
          activities.push({
            content,
            ref,
            timestamp,
            comment: false,
            imageRef: `${collection.properties[propertyId].type}Update`,
          });
      }
    }
    return activities;
  }

  simpleFieldActivity(
    propertyId: string,
    data: any,
    collection: Collection,
    diff: Diff<any>,
    caller: string,
  ): { content: string; ref: MappedItem<Ref> } {
    const { added, deleted, updated } = diff;
    if (propertyId in added) {
      if (caller)
        return {
          content: `set ${collection.properties[propertyId].name} to ${data}`,
          ref: {
            actor: {
              id: caller,
              refType: 'user',
            },
          },
        };
      else
        return {
          content: `Property ${collection.properties[propertyId].name} was set to ${data}`,
          ref: {},
        };
    } else if (propertyId in deleted) {
      if (caller)
        return {
          content: `cleared ${collection.properties[propertyId].name}`,
          ref: {
            actor: {
              id: caller,
              refType: 'user',
            },
          },
        };
      else {
        return {
          content: `Property ${collection.properties[propertyId].name} was cleared`,
          ref: {},
        };
      }
    } else if (propertyId in updated) {
      if (data === '' || data === null) {
        if (caller)
          return {
            content: `cleared ${collection.properties[propertyId].name}`,
            ref: {
              actor: {
                id: caller,
                refType: 'user',
              },
            },
          };
        else {
          return {
            content: `Property ${collection.properties[propertyId].name} was cleared`,
            ref: {},
          };
        }
      }
      if (caller)
        return {
          content: `updated ${collection.properties[propertyId].name}`,
          ref: {
            actor: {
              id: caller,
              refType: 'user',
            },
          },
        };
      else
        return {
          content: `Property ${collection.properties[propertyId].name} was updated`,
          ref: {},
        };
    }
    return { content: null, ref: {} };
  }

  longTextActivity(
    propertyId: string,
    data: any,
    collection: Collection,
    diff: Diff<any>,
    caller: string,
  ): { content: string; ref: MappedItem<Ref> } {
    const { added, deleted, updated } = diff;
    if (propertyId in added) {
      if (caller)
        return {
          content: `set ${collection.properties[propertyId].name}`,
          ref: {
            actor: {
              id: caller,
              refType: 'user',
            },
          },
        };
      else
        return {
          content: `Property ${collection.properties[propertyId].name} was set`,
          ref: {},
        };
    } else if (propertyId in deleted) {
      if (caller)
        return {
          content: `cleared ${collection.properties[propertyId].name}`,
          ref: {
            actor: {
              id: caller,
              refType: 'user',
            },
          },
        };
      else {
        return {
          content: `Property ${collection.properties[propertyId].name} was cleared`,
          ref: {},
        };
      }
    } else if (propertyId in updated) {
      if (data === '' || data === null) {
        if (caller)
          return {
            content: `cleared ${collection.properties[propertyId].name}`,
            ref: {
              actor: {
                id: caller,
                refType: 'user',
              },
            },
          };
        else {
          return {
            content: `Property ${collection.properties[propertyId].name} was cleared`,
            ref: {},
          };
        }
      }
      if (caller)
        return {
          content: `updated ${collection.properties[propertyId].name}`,
          ref: {
            actor: {
              id: caller,
              refType: 'user',
            },
          },
        };
      else
        return {
          content: `Property ${collection.properties[propertyId].name} was updated`,
          ref: {},
        };
    }
    return { content: null, ref: {} };
  }
  dateFieldActivity(
    propertyId: string,
    data: any,
    collection: Collection,
    diff: Diff<any>,
    caller: string,
  ): { content: string; ref: MappedItem<Ref> } {
    const { added, deleted, updated } = diff;
    if (propertyId in added) {
      if (caller)
        return {
          content: `set ${collection.properties[propertyId].name} to ${
            data.slice(0, -1).split('T')[0]
          }`,
          ref: {
            actor: {
              id: caller,
              refType: 'user',
            },
          },
        };
      else
        return {
          content: `Property ${
            collection.properties[propertyId].name
          } was set to ${data.slice(0, -1).split('T')[0]}`,
          ref: {},
        };
    } else if (propertyId in deleted) {
      if (caller)
        return {
          content: `cleared ${collection.properties[propertyId].name}`,
          ref: {
            actor: {
              id: caller,
              refType: 'user',
            },
          },
        };
      else {
        return {
          content: `Property ${collection.properties[propertyId].name} was cleared`,
          ref: {},
        };
      }
    } else if (propertyId in updated) {
      if (data === '' || data === null) {
        if (caller)
          return {
            content: `cleared ${collection.properties[propertyId].name}`,
            ref: {
              actor: {
                id: caller,
                refType: 'user',
              },
            },
          };
        else {
          return {
            content: `Property ${collection.properties[propertyId].name} was cleared`,
            ref: {},
          };
        }
      }
      if (caller)
        return {
          content: `updated ${collection.properties[propertyId].name} to ${
            data.slice(0, -1).split('T')[0]
          }`,
          ref: {
            actor: {
              id: caller,
              refType: 'user',
            },
          },
        };
      else
        return {
          content: `Property ${
            collection.properties[propertyId].name
          } was updated to ${data.slice(0, -1).split('T')[0]}`,
          ref: {},
        };
    }
    return { content: null, ref: {} };
  }

  singleUserFieldActivity(
    propertyId: string,
    data: any,
    collection: Collection,
    diff: Diff<any>,
    caller: string,
  ): { content: string; ref: MappedItem<Ref> } {
    const { added, deleted, updated } = diff;
    if (propertyId in added || propertyId in updated || propertyId in deleted) {
      if (data && data.length > 0) {
        if (caller)
          return {
            content: `set ${collection.properties[propertyId].name} to {{user}}`,
            ref: {
              actor: {
                id: caller,
                refType: 'user',
              },
              user: {
                id: data,
                refType: 'user',
              },
            },
          };
        else
          return {
            content: `Property ${collection.properties[propertyId].name} was set to {{user}}`,
            ref: {
              user: {
                id: data,
                refType: 'user',
              },
            },
          };
      } else {
        if (caller)
          return {
            content: `cleared ${collection.properties[propertyId].name}`,
            ref: {
              actor: {
                id: caller,
                refType: 'user',
              },
            },
          };
        else {
          return {
            content: `Property ${collection.properties[propertyId].name} was cleared`,
            ref: {},
          };
        }
      }
    }
    return { content: null, ref: {} };
  }

  multiUserFieldActivity(
    propertyId: string,
    data: any,
    collection: Collection,
    diff: Diff<any>,
    caller: string,
  ): { content: string; ref: MappedItem<Ref> } {
    const { added, deleted, updated } = diff;
    if (propertyId in added || propertyId in updated || propertyId in deleted) {
      if (data && data.length > 0) {
        let dynamicData = '';
        const dynamicRef = {};
        for (let i = 0; i < data.length; i++) {
          if (i !== data.length - 1) dynamicData += `{{user${i}}}, `;
          else dynamicData += `{{user${i}}}`;
          dynamicRef[`user${i}`] = {
            id: data[i],
            refType: 'user',
          };
        }
        if (caller)
          return {
            content: `set ${collection.properties[propertyId].name} to ${dynamicData}`,
            ref: {
              ...dynamicRef,
              actor: {
                id: caller,
                refType: 'user',
              },
            },
          };
        else
          return {
            content: `Property ${collection.properties[propertyId].name} was set to ${dynamicData}`,
            ref: {
              ...dynamicRef,
            },
          };
      } else {
        if (caller)
          return {
            content: `cleared ${collection.properties[propertyId].name}`,
            ref: {
              actor: {
                id: caller,
                refType: 'user',
              },
            },
          };
        else
          return {
            content: `Property ${collection.properties[propertyId].name} was cleared`,
            ref: {},
          };
      }
    }
    return { content: null, ref: {} };
  }

  rewardFieldActivity(
    propertyId: string,
    data: any,
    collection: Collection,
    diff: Diff<any>,
    caller: string,
  ): { content: string; ref: MappedItem<Ref> } {
    const { added, deleted, updated } = diff;
    if (propertyId in added || propertyId in deleted || propertyId in updated) {
      if (data && data.value) {
        if (caller)
          return {
            content: `set ${collection.properties[propertyId].name} to ${data.value} ${data.token?.label}`,
            ref: {
              actor: {
                id: caller,
                refType: 'user',
              },
            },
          };
        else
          return {
            content: `Property ${collection.properties[propertyId].name} was set to ${data.value} ${data.token?.label}`,
            ref: {},
          };
      } else {
        if (caller)
          return {
            content: `cleared ${collection.properties[propertyId].name}`,
            ref: {
              actor: {
                id: caller,
                refType: 'user',
              },
            },
          };
        else {
          return {
            content: `Property ${collection.properties[propertyId].name} was cleared`,
            ref: {},
          };
        }
      }
    }

    return { content: null, ref: {} };
  }

  milestoneFieldActivity(
    propertyId: string,
    data: any,
    collection: Collection,
    diff: Diff<any>,
    caller: string,
  ): { content: string; ref: MappedItem<Ref> } {
    const { added, deleted, updated } = diff;

    if (propertyId in added) {
      return {
        content: `added milestone to ${collection.properties[propertyId].name}`,
        ref: {
          actor: {
            id: caller,
            refType: 'user',
          },
        },
      };
    }
    if (propertyId in deleted) {
      return {
        content: `removed milestone from ${collection.properties[propertyId].name}`,
        ref: {
          actor: {
            id: caller,
            refType: 'user',
          },
        },
      };
    }
    if (propertyId in updated) {
      return {
        content: `updated milestone in ${collection.properties[propertyId].name}`,
        ref: {
          actor: {
            id: caller,
            refType: 'user',
          },
        },
      };
    }

    return { content: null, ref: {} };
  }

  singleSelectFieldActivity(
    propertyId: string,
    data: any,
    collection: Collection,
    diff: Diff<any>,
    caller: string,
  ): { content: string; ref: MappedItem<Ref> } {
    const { added, deleted, updated } = diff;
    if (propertyId in added || propertyId in deleted || propertyId in updated) {
      if (data && data.label) {
        if (caller)
          return {
            content: `set ${collection.properties[propertyId].name} to ${data.label}`,
            ref: {
              actor: {
                id: caller,
                refType: 'user',
              },
            },
          };
        else
          return {
            content: `Property ${collection.properties[propertyId].name} was set to ${data.label}`,
            ref: {},
          };
      } else {
        if (caller)
          return {
            content: `cleared ${collection.properties[propertyId].name}`,
            ref: {
              actor: {
                id: caller,
                refType: 'user',
              },
            },
          };
        else {
          return {
            content: `Property ${collection.properties[propertyId].name} was cleared`,
            ref: {},
          };
        }
      }
    }
    return { content: null, ref: {} };
  }

  multiSelectFieldActivity(
    propertyId: string,
    data: any,
    collection: Collection,
    diff: Diff<any>,
    caller: string,
  ): { content: string; ref: MappedItem<Ref> } {
    const { added, deleted, updated } = diff;
    if (propertyId in added || propertyId in deleted || propertyId in updated) {
      if (data && data.length > 0) {
        if (caller)
          return {
            content: `set ${collection.properties[propertyId].name} to ${data
              .map((d) => d.label)
              .join(',')}`,
            ref: {
              actor: {
                id: caller,
                refType: 'user',
              },
            },
          };
        else
          return {
            content: `Property ${
              collection.properties[propertyId].name
            } was set to ${data.map((d) => d.label).join(',')}`,
            ref: {},
          };
      } else {
        if (caller)
          return {
            content: `cleared ${collection.properties[propertyId].name}`,
            ref: {
              actor: {
                id: caller,
                refType: 'user',
              },
            },
          };
        else {
          return {
            content: `Property ${collection.properties[propertyId].name} was cleared`,
            ref: {},
          };
        }
      }
    }
    return { content: null, ref: {} };
  }

  cardStatusActivity(
    propertyId: string,
    data: any,
    collection: Collection,
    diff: Diff<any>,
    caller: string,
  ): { content: string; ref: MappedItem<Ref> } {
    const { added, deleted, updated } = diff;
    if (propertyId in added || propertyId in deleted || propertyId in updated) {
      if (caller)
        return {
          content: `Card Status set to ${data}`,
          ref: {
            actor: {
              id: caller,
              refType: 'user',
            },
          },
        };
    }
    return { content: null, ref: {} };
  }
}
