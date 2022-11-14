export interface CredentalInterface {
  credentialType: string;

  getNumberOfSimilarStamps(address1: string, address2: string): Promise<number>;

  getAll(): Promise<Credential[]>;

  hasCredential(address: string, credentialId: string): Promise<boolean>;
}
