import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole, UserStatus } from './schemas/user.schema';

export interface CreateUserDto {
  email:     string;
  password:  string;
  firstName: string;
  lastName:  string;
  bio?:      string;
}

export interface UpdateUserDto {
  firstName?:    string;
  lastName?:     string;
  bio?:          string;
  role?:         UserRole;
  refreshToken?: string | null;
  lastLogin?:    Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>
  ) {}

  /**
   * Crée un utilisateur avec le rôle "author" par défaut.
   * Cela permet aux nouveaux inscrits de créer et soumettre des articles.
   */
  async create(dto: CreateUserDto): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = new this.userModel({
      name:         `${dto.firstName} ${dto.lastName}`.trim(),
      email:        dto.email,
      password:     hashedPassword,
      firstName:    dto.firstName,
      lastName:     dto.lastName,
      bio:          dto.bio ?? '',
      // ⚡ IMPORTANT : "author" par défaut pour permettre la création d'articles
      role:         UserRole.AUTHOR,
      status:       UserStatus.ACTIVE,
      createdAt:    new Date()
    });

    return user.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password -refreshToken').exec();
  }

  async findOne(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .select('-password')
      .exec();
  }

  async remove(id: string): Promise<void> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    await this.userModel.findByIdAndDelete(id);
  }

  async validatePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { lastLogin: new Date() });
  }

  async getUserStats() {
    const [total, admins, editors, authors, users] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ role: UserRole.ADMIN }),
      this.userModel.countDocuments({ role: UserRole.EDITOR }),
      this.userModel.countDocuments({ role: UserRole.AUTHOR }),
      this.userModel.countDocuments({ role: UserRole.USER })
    ]);

    return { total, admins, editors, authors, users };
  }

  async getTopAuthors() {
    return this.userModel
      .find({ role: UserRole.AUTHOR, status: UserStatus.ACTIVE })
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();
  }

  async changeStatus(id: string, status: UserStatus): Promise<UserDocument | null> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    
    return this.userModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .select('-password -refreshToken')
      .exec();
  }

  async changeRole(id: string, role: UserRole): Promise<UserDocument | null> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    
    return this.userModel
      .findByIdAndUpdate(id, { role }, { new: true })
      .select('-password -refreshToken')
      .exec();
  }
}