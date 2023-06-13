import {
  GetContractMetadataQueryHandler,
  GetTokenMetadataQueryHandler,
} from './get-token-metadata.handler';

export const QueryHandlers = [
  GetTokenMetadataQueryHandler,
  GetContractMetadataQueryHandler,
];