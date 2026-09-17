import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength, IsBoolean, IsNumber, Min } from 'class-validator';
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

  @IsOptional()
  @IsNumber()
  subscriptionMonths?: number; // 1, 2, 3, 6, 12 hoặc 0/null nếu Vĩnh viễn

  @IsOptional()
  @IsNumber()
  monthlyPrice?: number; // Admin tự nhập số tiền hàng tháng

  @IsOptional()
  @IsString()
  subscriptionStartDate?: string;
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

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @MinLength(6, { message: 'Mật khẩu phải từ 6 ký tự trở lên' })
  password?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ (PERSONAL, SALES, ADMIN)' })
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  subscriptionMonths?: number;

  @IsOptional()
  @IsNumber()
  monthlyPrice?: number;

  @IsOptional()
  @IsString()
  subscriptionExpiresAt?: string;
}

export class RenewSubscriptionDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Số tháng gia hạn tối thiểu là 1' })
  months: number;

  @IsOptional()
  @IsNumber()
  monthlyPrice?: number; // Cập nhật đơn giá nếu cần
}
