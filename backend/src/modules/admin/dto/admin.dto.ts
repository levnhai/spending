import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';
import { UserRole } from '../../../schemas/user.schema';

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ (PERSONAL, SALES, ADMIN)' })
  role: UserRole;
}

export class UpdateUserStatusDto {
  @IsNotEmpty()
  @IsBoolean()
  isActive: boolean;
}

export class CreateAdminUserDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty()
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự trở lên' })
  password: string;

  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class GetUsersFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  status?: string; // 'active' | 'blocked' | 'all'
}
