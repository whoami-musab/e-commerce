import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service.js";
import { RegisterDto } from "../../dto/create-user.dto.js";
import * as argon2 from 'argon2'
import { Prisma } from "../../../generated/prisma/client.js";


@Injectable()
export class RegisterService {
    constructor(private readonly prisma: PrismaService) { }

    async execute(dto: RegisterDto) {
        // Check empty fields
        if (!dto.firstName || !dto.lastName || !dto.username || !dto.email || !dto.password) {
            throw new BadRequestException('All fields are required!')
        }


        const exists = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { username: dto.username },
                    { email: dto.email }
                ]
            },
            select: { id: true }
        });

        // Check if user already exists
        if (exists) {
            throw new BadRequestException('User already registered!')
        }


        // Hash the password
        const hashedPass = await argon2.hash(dto.password, {
            type: argon2.argon2id,
            memoryCost: 19456,
            timeCost: 2,
            parallelism: 1,
        })

        try {

            const user = await this.prisma.user.create({
                data: {
                    username: dto.username,
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    email: dto.email,
                    password: hashedPass
                },
                select: {
                    id: true,
                    username: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                }
            });

            return {
                success: true,
                message: "Registration successfull!",
                user
            }
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new ConflictException('Username or email already exists!')
            }
            throw new InternalServerErrorException('Something went wrong during registration!')
        }

    }
}