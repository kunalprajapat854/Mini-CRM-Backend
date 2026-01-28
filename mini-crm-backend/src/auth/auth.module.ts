// Check src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Module({
  providers: [UsersService],
  exports: [UsersService],
})
export class AuthModule {}// <--- Make sure this class name matches exactly