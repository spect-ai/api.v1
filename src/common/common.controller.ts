import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GasPredictionService } from './gas-prediction.service';
import fetch from 'node-fetch';
import { RequiredUrlDto } from './dtos/string.dto';
import { parse } from 'parse5';
import { GetTokenMetadataCommand } from 'src/users/commands/impl';
import { CommandBus } from '@nestjs/cqrs';
@Controller('common')
@ApiTags('common')
export class CommonController {
  constructor(
    private readonly gasPredictionService: GasPredictionService,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('/gasPrediction')
  async gasPrediction(@Query() param: any) {
    return await this.gasPredictionService.predictGas(param.chainId);
  }

  @Post('/getTokenMetadata')
  async getTokenMetadata(
    @Body()
    body: {
      chainId: string;
      tokenType: string;
      tokenAddress: string;
      tokenId?: string;
    },
  ) {
    return await this.commandBus.execute(
      new GetTokenMetadataCommand(
        body.chainId,
        body.tokenType,
        body.tokenAddress,
        body.tokenId,
      ),
    );
  }

  @Post('/url')
  async url(@Body() body: RequiredUrlDto): Promise<{
    allowsEmbed: boolean;
    title?: string;
    description?: string;
    imageURL?: string;
  }> {
    try {
      const res = await fetch(body.url);
      if (!res.ok) {
        throw new Error(
          `Something went wrong while fetching ${body.url}: ${res.status} ${res.statusText}`,
        );
      }
      const xFrameOptions = res.headers.get('x-frame-options');
      if (!xFrameOptions || xFrameOptions.toLowerCase() === 'allow-from') {
        return {
          allowsEmbed: true,
        };
      }

      const text = await res.text();
      const document = parse(text);
      const titleNode = findElement(document, 'title');
      const imgNode = findElementByAttr(document, 'meta', 'name', 'image');
      const descriptionNode = findElementByAttr(
        document,
        'meta',
        'name',
        'description',
      );

      const title = titleNode?.childNodes?.[0]?.value;
      const imageURL = imgNode?.attrs.find(
        (attr) => attr.name === 'src',
      )?.value;
      const description = descriptionNode?.attrs.find(
        (attr) => attr.name === 'content',
      )?.value;

      return {
        allowsEmbed: false,
        title,
        description,
        imageURL,
      };
    } catch (e) {
      throw e;
    }
  }
}

function findElement(node, tagName) {
  if (node.tagName === tagName) {
    return node;
  }

  if (node.childNodes) {
    for (const childNode of node.childNodes) {
      const result = findElement(childNode, tagName);
      if (result) {
        return result;
      }
    }
  }

  return null;
}

function findElementByAttr(node, tagName, attrName, attrValue) {
  if (
    node.tagName === tagName &&
    node.attrs.some(
      (attr) => attr.name === attrName && attr.value === attrValue,
    )
  ) {
    return node;
  }

  if (node.childNodes) {
    for (const childNode of node.childNodes) {
      const result = findElementByAttr(childNode, tagName, attrName, attrValue);
      if (result) {
        return result;
      }
    }
  }

  return null;
}
