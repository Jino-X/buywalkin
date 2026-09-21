import { UserRole } from '@prisma/client';

export interface RequestUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
