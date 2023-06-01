import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { Activity } from 'src/common/types/activity.type';
import { NotificationV2 } from 'src/users/types/types';

export class ConnectUserDto {
  /**
   * The signature of the user
   * @example 0x7c6e41bbe211c265c5b2b9baaad9a134c0ea179a561b1f29f3f5d1dc9854095229a5ab4e311c5daa554568a8ffd18e9dddcce5bb561300a06f39600b830f71ea1c
   */
  @IsString()
  @IsNotEmpty()
  signature: string;

  /**
   * The message of the signature
   * @example '{"domain":"localhost:3000","address":"0x6304CE63F2EBf8C0Cc76b60d34Cc52a84aBB6057","statement":"Sign in with Ethereum to the app.","uri":"http://localhost:3000","version":"1","chainId":137,"nonce":"QagEAtOtgjksroxNu","issuedAt":"2022-11-09T09:40:57.409Z"}'
   */
  @IsObject()
  @IsNotEmpty()
  message: {
    domain: string;
    address: string;
    statement: string;
    uri: string;
    version: string;
    chainId: number;
    nonce: string;
    issuedAt: string;
  };
}

export class ConnectUserResponseDto {
  /**
   * Username of the user
   * @example "avp1598"
   */
  username: string;

  /**
   * The description of the profile
   * @example "I am a software developer"
   */
  bio: string;

  /**
   * Ethereum address
   * @example "0x6304CE63F2EBf8C0Cc76b60d34Cc52a84aBB6057"
   */
  ethAddress: string;

  /**
   * Avatar
   * @example "https://i.pravatar.cc/300"
   */
  avatar: string;

  /**
   * List of accounts connected to this user
   * @example []
   */
  accounts: string[];

  /**
   * Email of user
   * @example "avp@gmail.com"
   */
  email: string;

  /**
   * Github Integration user id
   * @example "123456789"
   */
  githubId: string;

  /**
   * List of circles this user is a member of, this will contain both parent and child circles
   * @example ['62f7395628ef93d8f2a686cb', '62ff23f5c2412e3e2a73dd60', '62ff559cc2412e3e2a73e2b5']
   */
  circles: string[];

  /**
   * List of collections created by the user
   * @example ['62f7395628ef93d8f2a686cb', '62ff23f5c2412e3e2a73dd60', '62ff559cc2412e3e2a73e2b5']
   */
  collections: string[];

  /**
   * List of forms responded to by the user
   * @example ['62f7395628ef93d8f2a686cb', '62ff23f5c2412e3e2a73dd60', '62ff559cc2412e3e2a73e2b5']
   */
  collectionsSubmittedTo: string[];

  /**
   * Activities taken by the user
   * @example [{actionType:"create", content:"has added a card",id:"17c1106f-206b-4251-ad07-6c89d3d8c815", linkPath:[],ref:{},stakeholders:[],timestamp:"2022-11-09T09:40:57.409Z"}]
   */
  activities: Activity[];

  /**
   * Notifications for the user
   * @example [{content:"Your response on Alchemix Grants Program was received", ref:null}]
   */
  notificationsV2: NotificationV2[];
}
