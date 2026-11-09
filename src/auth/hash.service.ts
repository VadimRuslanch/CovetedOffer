import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class HashService {
  async hash(value: string) {
    return await argon2.hash(value);
  }

  async verify(hash: string, value: string) {
    return await argon2.verify(hash, value);
  }
}
