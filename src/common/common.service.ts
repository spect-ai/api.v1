import { Injectable } from '@nestjs/common';
import { detailedDiff as objectDiff } from 'deep-object-diff';
import { diff as arrayDiff } from 'fast-array-diff';
import { PropertyType } from 'src/collection/types/types';
import { MappedItem } from './interfaces';
import TurndownService = require('turndown');
import { Alchemy, Network } from 'alchemy-sdk';

@Injectable()
export class CommonTools {
  flatten(mappedItem: MappedItem<any>) {
    const res = [];
    for (const [key, value] of Object.entries(mappedItem)) {
      res.push({
        ...value,
        id: key,
      });
    }
    return res;
  }

  objectify(arrOfObjects: any[], key: string) {
    const res = {};
    for (const obj of arrOfObjects) {
      res[obj[key]] = obj;
    }

    return res;
  }

  arrayify(arrOfObjects: any[], key: string) {
    let res = [];
    for (const obj of arrOfObjects) {
      res = [...res, ...obj[key]];
    }
    return res;
  }

  distinctifyArray(arr: any[]) {
    return [...new Set(arr)];
  }

  distinctify(arrOfObjects: any[], uniqueKey: string) {
    const keyExists = {};
    const newArrOdObjects = [] as any[];
    for (const obj of arrOfObjects) {
      if (!keyExists[obj[uniqueKey]]) {
        keyExists[obj[uniqueKey]] = true;
        newArrOdObjects.push(obj);
      }
    }
    return newArrOdObjects;
  }

  mergeObjects(obj1: object, obj2: object, obj3?: object) {
    let res;
    if (obj3) {
      res = { ...obj1, ...obj2, ...obj3 };
    } else {
      res = { ...obj1, ...obj2 };
    }
    return res;
  }

  collateifyBooleanFields(arrOfObjects: any[], operator = 'or') {
    const res = {};
    for (const obj of arrOfObjects) {
      for (const [key, val] of Object.entries(obj)) {
        if (!res[key]) {
          res[key] = val;
        } else {
          if (operator === 'or') {
            res[key] = res[key] || val;
          } else if (operator === 'and') {
            res[key] = res[key] && val;
          }
        }
      }
    }
    return res;
  }

  setOrAggregateObjectKey(obj: object, key: string, value: number) {
    if (key in obj) {
      obj[key] += value;
    } else {
      obj[key] = value;
    }
    return obj;
  }

  setOrAppend(obj: object, key: string, value: any) {
    if (key in obj) {
      obj[key] = [...obj[key], value];
    } else {
      obj[key] = [value];
    }
    return obj;
  }

  removeFromArray(obj: object, key: string, value: any) {
    if (key in obj) {
      return obj[key].filter((item) => item !== value);
    } else {
      return obj;
    }
  }

  findDifference(obj1: object | any[], obj2: object | any[]) {
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      return arrayDiff(obj1, obj2);
    } else if (typeof obj1 === 'object' && typeof obj2 === 'object') {
      return objectDiff(obj1, obj2);
    } else {
      throw new Error('Invalid input to findDifference');
    }
  }

  isDifferent(elem1: any, elem2: any, type: PropertyType) {
    switch (type) {
      case 'number':
      case 'shortText':
      case 'longText':
      case 'user':
      case 'ethAddress':
      case 'date':
      case 'email':
      case 'singleURL':
      case 'slider':
        return elem1 !== elem2;
      case 'user[]':
        const difference = arrayDiff(elem1, elem2);
        return (
          difference.added?.length !== 0 || difference.removed?.length !== 0
        );
      case 'singleSelect':
        return elem1.value !== elem2.value;
      case 'multiURL':
      case 'multiSelect':
        const elem1ValueSet = new Set([...elem1.map((e) => e.value)]);
        const elem2ValueSet = new Set([...elem2.map((e) => e.value)]);

        const eqSet = (xs, ys) =>
          xs.size === ys.size && [...xs].every((x) => ys.has(x));

        return !eqSet(elem1ValueSet, elem2ValueSet);
      case 'reward':
        return (
          elem1.value !== elem2.value ||
          elem1.chain.chainId !== elem2.chain.chainId ||
          elem1.token.address !== elem2.token.address
        );
    }
  }

  isHtml(str: string) {
    const regex = /(<([^>]+)>)/gi;
    return regex.test(str);
  }

  removeBackslashFromEmptyLines(text: string) {
    if (!text) return text;
    const lines = text.split('\n');
    const modifiedLines = lines.map((line, index) => {
      if (line.trim() === '\\') {
        return '';
      } else {
        return line;
      }
    });
    return modifiedLines.join('\n');
  }

  enrichHeadings(text: string) {
    if (!text) return text;
    const lines = text.split('\n');
    const convertedLines = lines.map((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('# ')) {
        const heading = trimmedLine.substring(2);
        return `__**${heading}**__`;
      } else if (trimmedLine.startsWith('## ')) {
        const heading = trimmedLine.substring(3);
        return `__${heading}__`;
      } else if (trimmedLine.startsWith('### ')) {
        const heading = trimmedLine.substring(4);
        return `**${heading}**`;
      }
      return line;
    });
    return convertedLines.join('\n');
  }

  enrich(text: string) {
    let md;
    if (this.isHtml(text)) {
      const turndownService = new TurndownService({
        blankReplacement(content, node) {
          const src = (node as any).getAttribute('src');
          if (src) {
            return ` ${src} `;
          }
          return content;
        },
      });

      md = turndownService.turndown(text);
    } else md = text;

    let enrichedText = this.removeBackslashFromEmptyLines(md || '');
    enrichedText = this.enrichHeadings(enrichedText || '');

    return enrichedText;
  }
}

export function alchemyInstance(chainId) {
  switch (chainId) {
    case '1':
      console.log('ETH');
      const config = {
        apiKey: process.env.ALCHEMY_API_KEY_MAINNET,
        network: Network.ETH_MAINNET,
      };
      return new Alchemy(config);

    case '137':
      console.log('MATIC');
      const configMatic = {
        apiKey: process.env.ALCHEMY_API_KEY_POLYGON,
        network: Network.MATIC_MAINNET,
      };
      return new Alchemy(configMatic);

    case '80001':
      console.log('MUMBAI');
      const configMumbai = {
        apiKey: process.env.ALCHEMY_API_KEY_MUMBAI,
        network: Network.MATIC_MUMBAI,
      };
      return new Alchemy(configMumbai);

    case '10':
      console.log('OPTIMISM');
      const configOptimism = {
        apiKey: process.env.ALCHEMY_API_KEY_OPTIMISM,
        network: Network.OPT_MAINNET,
      };
      return new Alchemy(configOptimism);

    case '42161':
      console.log('ARBITRUM');
      const configArbitrum = {
        apiKey: process.env.ALCHEMY_API_KEY_ARBITRUM,
        network: Network.ARB_MAINNET,
      };
      return new Alchemy(configArbitrum);

    default:
      throw 'Invalid chainId';
  }
}
