import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(params: { email: string; password: string; name: string; timezone?: string }) {
    const existing = await this.findByEmail(params.email);
    if (existing) {
      throw new ConflictException('Já existe uma conta com este e-mail.');
    }

    const passwordHash = await bcrypt.hash(params.password, SALT_ROUNDS);

    return this.prisma.user.create({
      data: {
        email: params.email,
        passwordHash,
        name: params.name,
        timezone: params.timezone ?? 'America/Sao_Paulo',
      },
    });
  }

  verifyPassword(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }
}
