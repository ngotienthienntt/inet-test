import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(data: CreateUserDto): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const user = this.usersRepository.create({
      email: data.email,
      passwordHash,
      fullName: data.fullName,
      phone: data.phone,
    });
    return this.usersRepository.save(user);
  }

  async updateProfile(id: number, data: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    Object.assign(user, data);
    return this.usersRepository.save(user);
  }
}
