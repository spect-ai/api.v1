import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv } from 'crypto';

@Injectable()
export class EncryptionService {
  encrypt(textToEncrypt: string) {
    const cipher = createCipheriv(
      'aes-256-ecb',
      process.env.ENCRYPTION_KEY,
      '',
    );
    return Buffer.concat([
      cipher.update(textToEncrypt),
      cipher.final(),
    ]).toString('base64');
  }

  decrypt(encryptedText: any) {
    const decipher = createDecipheriv(
      'aes-256-ecb',
      process.env.ENCRYPTION_KEY,
      '',
    );
    const base64DecryptedText = Buffer.concat([
      decipher.update(encryptedText, 'base64'),
      decipher.final(),
    ]);

    const decryptedText = base64DecryptedText.toString();
    return decryptedText;
  }
}
