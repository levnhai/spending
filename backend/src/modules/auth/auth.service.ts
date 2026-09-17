import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../../schemas/user.schema';
import { RegisterDto, LoginDto, UpdateProfileDto, ChangePasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userModel.findOne({ email: registerDto.email.toLowerCase() });
    if (existingUser) {
      throw new ConflictException('Email này đã được đăng ký');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const newUser = new this.userModel({
      email: registerDto.email.toLowerCase(),
      passwordHash,
      fullName: registerDto.fullName,
      role: UserRole.PERSONAL,
      hiddenMenus: [],
    });

    const savedUser = await newUser.save();
    const token = this.generateToken(savedUser);

    return {
      user: {
        id: savedUser._id,
        email: savedUser.email,
        fullName: savedUser.fullName,
        currency: savedUser.currency,
        language: savedUser.language,
        avatarUrl: savedUser.avatarUrl,
        role: savedUser.role || UserRole.PERSONAL,
        hiddenMenus: savedUser.hiddenMenus || [],
      },
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({ email: loginDto.email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    // 1. Kiểm tra trạng thái hoạt động
    if (user.isActive === false) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.');
    }

    // 2. Kiểm tra thời hạn thuê bao (ngoại trừ ADMIN)
    if (user.role !== UserRole.ADMIN && user.subscriptionExpiresAt) {
      const now = new Date();
      if (now > new Date(user.subscriptionExpiresAt)) {
        user.isActive = false;
        await user.save();

        const expireDateStr = new Intl.DateTimeFormat('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(new Date(user.subscriptionExpiresAt));

        throw new UnauthorizedException(
          `Tài khoản đã hết hạn sử dụng vào ngày ${expireDateStr}. Vui lòng liên hệ Quản trị viên để gia hạn.`,
        );
      }
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        currency: user.currency,
        language: user.language,
        avatarUrl: user.avatarUrl,
        role: user.role || UserRole.PERSONAL,
        hiddenMenus: user.hiddenMenus || [],
        subscriptionMonths: user.subscriptionMonths,
        monthlyPrice: user.monthlyPrice,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-passwordHash');
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    if (user.isActive === false) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
    }

    if (user.role !== UserRole.ADMIN && user.subscriptionExpiresAt) {
      if (new Date() > new Date(user.subscriptionExpiresAt)) {
        user.isActive = false;
        await user.save();
        throw new UnauthorizedException('Tài khoản đã hết hạn sử dụng. Vui lòng liên hệ Quản trị viên để gia hạn.');
      }
    }

    return {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      currency: user.currency,
      language: user.language,
      avatarUrl: user.avatarUrl,
      role: user.role || UserRole.PERSONAL,
      hiddenMenus: user.hiddenMenus || [],
      subscriptionMonths: user.subscriptionMonths,
      monthlyPrice: user.monthlyPrice,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    };
  }

  async updateProfile(userId: string, updateDto: UpdateProfileDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    if (updateDto.fullName) user.fullName = updateDto.fullName;
    if (updateDto.avatarUrl !== undefined) user.avatarUrl = updateDto.avatarUrl;
    if (updateDto.currency) user.currency = updateDto.currency;
    if (updateDto.language) user.language = updateDto.language;
    if (updateDto.role) user.role = updateDto.role;
    if (updateDto.hiddenMenus !== undefined) user.hiddenMenus = updateDto.hiddenMenus;

    await user.save();

    return {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      currency: user.currency,
      language: user.language,
      avatarUrl: user.avatarUrl,
      role: user.role,
      hiddenMenus: user.hiddenMenus,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(dto.newPassword, salt);
    await user.save();

    return { message: 'Đổi mật khẩu thành công' };
  }

  private generateToken(user: UserDocument) {
    const payload = { sub: user._id, email: user.email, role: user.role || UserRole.PERSONAL };
    return this.jwtService.sign(payload);
  }
}
