import { v4 as uuidv4 } from 'uuid';

export function createJti(): string {
  return uuidv4();
}


