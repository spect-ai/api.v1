import { Injectable, InternalServerErrorException } from '@nestjs/common';
import fetch from 'node-fetch';
import { LoggingService } from 'src/logging/logging.service';
import { LensProfile } from '../types/types';

@Injectable()
export class LensService {
  constructor(private readonly logger: LoggingService) {
    this.logger.setContext('LensService');
  }

  async getLensProfilesByAddress(userAddress: string) {
    try {
      const multipleProfileData = JSON.stringify({
        query: `query Profile {
          profiles(request: { ownedBy: ["${userAddress}"] }) {
           items { id
            name
            bio           
            handle
            attributes {
              displayType
              traitType
              key
              value
            }
          }}
        }        
        `,
      });
      const res = await fetch('https://api.lens.dev', {
        method: 'POST',
        body: multipleProfileData,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
      return null;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        'Failed getting profiles with ethaddress with error ${e.message}',
      );
    }
  }

  async getLensProfile(handle: string): Promise<LensProfile> {
    try {
      const singleProfileData = JSON.stringify({
        query: `query Profile {
          profile(request: { handle: "${handle}" }) {
                    id
                    name
                    bio
                    handle
                    attributes {
                      displayType
                      traitType
                      key
                      value
                    }
                    ownedBy
            }}
          `,
      });
      const res = await fetch('https://api.lens.dev', {
        method: 'POST',
        body: singleProfileData,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(res);

      if (res.ok) {
        const data = await res.json();
        console.log(data);
        return data.data.profile;
      }
      return null;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        'Failed getting profile with error ${e.message}',
      );
    }
  }

  async getLensDefaultProfile(userAddress: string) {
    try {
      const defaultProfileData = JSON.stringify({
        query: `query DefaultProfile {
          defaultProfile(request: { ethereumAddress: ["${userAddress}"] }) {
           items { 
            id
            name
            bio           
            handle
            attributes {
              displayType
              traitType
              key
              value
            }
            ownedBy
            picture {
              ... on NftImage {
                contractAddress
                tokenId
                uri
                chainId
                verified
              }
              ... on MediaSet {
                original {
                  url
                  mimeType
                }
              }
            }
            coverPicture {
              ... on NftImage {
                contractAddress
                tokenId
                uri
                chainId
                verified
              }
              ... on MediaSet {
                original {
                  url
                  mimeType
                }
              }
            }
            dispatcher {
              address
              canUseRelay
            }
            stats {
              totalFollowers
              totalFollowing
              totalPosts
              totalComments
              totalMirrors
              totalPublications
              totalCollects
            }
          }}
        }        
        `,
      });
      const res = await fetch('https://api.lens.dev', {
        method: 'POST',
        body: defaultProfileData,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
      return null;
    } catch (e) {
      this.logger.error(e);
      throw new InternalServerErrorException(
        'Failed getting profiles with ethaddress with error ${e.message}',
      );
    }
  }
}
