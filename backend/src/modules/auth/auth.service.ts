import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../schemas/user.schema';
import { Wallet, WalletDocument, WalletType } from '../../schemas/wallet.schema';
import { Category, CategoryDocument } from '../../schemas/category.schema';
import { DEFAULT_CATEGORIES } from '../categories/default-categories';
import { RegisterDto, LoginDto, ChangePasswordDto, UpdateProfileDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName } = registerDto;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('Email đã được sử dụng');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await this.userModel.create({
      email,
      passwordHash,
      fullName,
    });

    // Seed default Wallets
    await this.walletModel.insertMany([
      { userId: newUser._id, name: 'Tiền mặt', type: WalletType.CASH, initialBalance: 0, currentBalance: 0, color: '#10B981', icon: 'Banknote', isDefault: true },
      { userId: newUser._id, name: 'Vietcombank', type: WalletType.BANK, initialBalance: 0, currentBalance: 0, color: '#3B82F6', icon: 'Building', isDefault: false },
      { userId: newUser._id, name: 'Ví Momo', type: WalletType.EWALLET, initialBalance: 0, currentBalance: 0, color: '#EC4899', icon: 'Wallet', isDefault: false },
    ]);

    // Seed default Categories
    const categoriesToSeed = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      userId: newUser._id,
    }));
    await this.categoryModel.insertMany(categoriesToSeed);

    const token = this.generateToken(newUser._id.toString(), newUser.email);

    return {
      message: 'Đăng ký tài khoản thành công',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        avatar: newUser.avatar,
        currency: newUser.currency,
        theme: newUser.theme,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const token = this.generateToken(user._id.toString(), user.email);

    return {
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        currency: user.currency,
        theme: user.theme,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-passwordHash');
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: dto },
      { new: true },
    ).select('-passwordHash');
    return user;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new BadRequestException('Người dùng không tồn tại');

    const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isMatch) throw new BadRequestException('Mật khẩu cũ không chính xác');

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(dto.newPassword, salt);
    await user.save();

    return { message: 'Đổi mật khẩu thành công' };
  }

  private generateToken(userId: string, email: string) {
    return this.jwtService.sign({ sub: userId, email });
  }
}
