import { PLATFORM_ID } from './types';

export type PlatformSpec = {
  icon?: string | undefined;
  platform: PLATFORM_ID;
  name: string;
  description: string;
  connectMessage: string;
  isEVM?: boolean;
  url?: string;
};

export const getPlatformSpec = (
  platformName: string,
): PlatformSpec | undefined => {
  let platformspec: PlatformSpec | undefined = undefined;
  PLATFORMS.forEach((platform) => {
    if (platform.platform === platformName) {
      platformspec = platform;
    }
  });
  return platformspec;
};

export const PLATFORMS: PlatformSpec[] = [
  {
    icon: './assets/passport/gitcoinStampIcon.svg',
    platform: 'Gitcoin',
    name: 'Gitcoin Grants',
    description: 'Connect with Github to verify with your Gitcoin account.',
    connectMessage: 'Connect Account',
    url: 'https://gitcoin.co',
  },
  {
    icon: './assets/passport/gtcPossessionStampIcon.svg',
    platform: 'GTC',
    name: 'GTC',
    description: 'GTC possession verification',
    connectMessage: 'Verify Account',
    isEVM: true,
    url: 'https://gitcoin.co',
  },
  {
    icon: './assets/passport/gtcStakingLogoIcon.svg',
    platform: 'GtcStaking',
    name: 'GTC Staking',
    description: 'Connect to passport to verify your staking amount.',
    connectMessage: 'Verify amount',
    isEVM: true,
    url: 'https://gitcoin.co',
  },
  {
    icon: './assets/passport/twitterStampIcon.svg',
    platform: 'Twitter',
    name: 'Twitter',
    description: 'Connect your existing Twitter account to verify.',
    connectMessage: 'Connect Account',
    url: 'https://twitter.com',
  },
  {
    icon: './assets/passport/googleStampIcon.svg',
    platform: 'Google',
    name: 'Google',
    description: 'Connect your existing Google Account to verify',
    connectMessage: 'Connect Account',
    url: 'https://google.com',
  },
  {
    icon: './assets/passport/githubStampIcon.svg',
    platform: 'Github',
    name: 'Github',
    description: 'Connect your existing Github account to verify.',
    connectMessage: 'Connect Account',
    url: 'https://github.com',
  },
  {
    icon: './assets/passport/facebookStampIcon.svg',
    platform: 'Facebook',
    name: 'Facebook',
    description: 'Connect your existing account to verify with Facebook.',
    connectMessage: 'Connect Account',
    url: 'https://facebook.com',
  },
  {
    icon: './assets/passport/ensStampIcon.svg',
    platform: 'Ens',
    name: 'ENS',
    description:
      'Purchase an .eth name to verify/ connect your existing account.',
    connectMessage: 'Connect Account',
    isEVM: true,
    url: 'https://ens.domains',
  },
  {
    icon: './assets/passport/poapStampIcon.svg',
    platform: 'POAP',
    name: 'POAP',
    description: 'Connect an account to a POAP owned for over 15 days.',
    connectMessage: 'Connect to POAP',
    isEVM: true,
    url: 'https://poap.xyz',
  },
  {
    icon: './assets/passport/brightidStampIcon.svg',
    platform: 'Brightid',
    name: 'BrightID',
    description: 'Connect your BrightID',
    connectMessage: 'Connect Account',
    isEVM: true,
    url: 'https://brightid.org',
  },
  {
    icon: './assets/passport/pohStampIcon.svg',
    platform: 'Poh',
    name: 'Proof of Humanity',
    description:
      'Connect your wallet to start the process of verifying with Proof of Humanity.',
    connectMessage: 'Connect Account',
    isEVM: true,
    url: 'https://www.proofofhumanity.id/',
  },
  {
    icon: './assets/passport/discordStampIcon.svg',
    platform: 'Discord',
    name: 'Discord',
    description: 'Connect your existing Discord account to verify.',
    connectMessage: 'Connect Account',
    url: 'https://discord.com',
  },
  {
    icon: './assets/passport/linkedinStampIcon.svg',
    platform: 'Linkedin',
    name: 'Linkedin',
    description: 'Connect your existing Linkedin account to verify.',
    connectMessage: 'Connect Account',
    url: 'https://linkedin.com',
  },
  {
    icon: './assets/passport/ethereumStampIcon.svg',
    platform: 'ETH',
    name: 'ETH',
    description: 'ETH possession and transaction verification',
    connectMessage: 'Verify Account',
    isEVM: true,
    url: 'https://ethereum.org',
  },
  // {
  //   icon: "./assets/passport/ethStampIcon.svg",
  //   platform: "Signer",
  //   name: "Ethereum Account",
  //   description: "Additional Ethereum account",
  //   connectMessage: "Connect Account",
  // },
  {
    icon: './assets/passport/snapshotStampIcon.svg',
    platform: 'Snapshot',
    name: 'Snapshot',
    description: 'Connect your existing account to verify with Snapshot.',
    connectMessage: 'Verify Account',
    isEVM: true,
    url: 'https://snapshot.org/#/',
  },
  {
    icon: './assets/passport/gitPOAPStampIcon.svg',
    platform: 'GitPOAP',
    name: 'GitPOAP',
    description: 'GitPOAP Verification',
    connectMessage: 'Connect Account',
    isEVM: true,
    url: 'https://www.gitpoap.io/',
  },
  {
    icon: './assets/passport/nftStampIcon.svg',
    platform: 'NFT',
    name: 'NFT Holder',
    description:
      'Connect a wallet and validate the stamp by retrieving an NFT.',
    connectMessage: 'Connect NFT',
    isEVM: true,
  },
  {
    icon: './assets/passport/zksyncStampIcon.svg',
    platform: 'ZkSync',
    name: 'ZkSync',
    description: 'ZkSync Verification',
    connectMessage: 'Verify Account',
    isEVM: true,
    url: 'https://zksync.io/',
  },
  {
    icon: './assets/passport/lensStampIcon.svg',
    platform: 'Lens',
    name: 'Lens',
    description: 'Lens Profile Verification',
    connectMessage: 'Verify Account',
    isEVM: true,
    url: 'https://lens.xyz/',
  },
  {
    icon: './assets/passport/gnosisSafeStampIcon.svg',
    platform: 'GnosisSafe',
    name: 'Gnosis Safe',
    description: 'Gnosis Safe Signer/Owner Verification',
    connectMessage: 'Verify Account',
    isEVM: true,
    url: 'https://gnosis-safe.io/',
  },
];
