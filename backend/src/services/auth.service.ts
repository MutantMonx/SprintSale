// @ts-nocheck
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma, config } from '../config/index.js';
import { UnauthorizedError, ConflictError, NotFoundError, ValidationError } from '../utils/errors.js';
import type { JwtPayload } from '../middleware/auth.js';
import type { User, UserTier } from '@prisma/client';

const SALT_ROUNDS = 12;

export interface RegisterInput {
    email: string;
    password: string;
    name?: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface UserResponse {
    id: string;
    email: string;
    name: string | null;
    tier: UserTier;
    emailVerified: boolean;
    createdAt: Date;
}

class AuthService {
    async register(input: RegisterInput): Promise<{ user: UserResponse; tokens: AuthTokens }> {
        const { email, password, name } = input;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            throw new ConflictError('Email already registered');
        }

        // Validate password strength
        if (password.length < 8) {
            throw new ValidationError('Password must be at least 8 characters');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: email.toLowerCase(),
                passwordHash,
                name,
            },
        });

        // Generate tokens
        const tokens = await this.generateTokens(user);

        return {
            user: this.toUserResponse(user),
            tokens,
        };
    }

    async login(input: LoginInput): Promise<{ user: UserResponse; tokens: AuthTokens }> {
        const { email, password } = input;

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user || user.deletedAt) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
            throw new UnauthorizedError('Invalid email or password');
        }

        const tokens = await this.generateTokens(user);

        return {
            user: this.toUserResponse(user),
            tokens,
        };
    }

    async refreshToken(refreshToken: string): Promise<AuthTokens> {
        // Verify the refresh token
        let payload: JwtPayload;
        try {
            payload = jwt.verify(refreshToken, config.jwt.secret) as JwtPayload;
        } catch {
            throw new UnauthorizedError('Invalid refresh token');
        }

        if (payload.type !== 'refresh') {
            throw new UnauthorizedError('Invalid token type');
        }

        // Check if token exists and is not revoked
        const storedToken = await prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });

        if (!storedToken || storedToken.revokedAt) {
            throw new UnauthorizedError('Invalid or revoked refresh token');
        }

        if (storedToken.expiresAt < new Date()) {
            throw new UnauthorizedError('Refresh token expired');
        }

        if (storedToken.user.deletedAt) {
            throw new UnauthorizedError('User deactivated');
        }

        // Revoke old token
        await prisma.refreshToken.update({
            where: { id: storedToken.id },
            data: { revokedAt: new Date() },
        });

        // Generate new tokens
        return this.generateTokens(storedToken.user);
    }

    async logout(refreshToken: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: { token: refreshToken },
            data: { revokedAt: new Date() },
        });
    }

    async logoutAll(userId: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }

    async getUser(userId: string): Promise<UserResponse> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.deletedAt) {
            throw new NotFoundError('User not found');
        }

        return this.toUserResponse(user);
    }

    async updateUser(userId: string, data: { name?: string }): Promise<UserResponse> {
        const user = await prisma.user.update({
            where: { id: userId },
            data,
        });

        return this.toUserResponse(user);
    }

    async deleteUser(userId: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: { deletedAt: new Date() },
        });

        // Revoke all refresh tokens
        await this.logoutAll(userId);
    }

    private async generateTokens(user: User): Promise<AuthTokens> {
        const accessPayload: JwtPayload = {
            userId: user.id,
            email: user.email,
            tier: user.tier,
            type: 'access',
        };

        const refreshPayload: JwtPayload = {
            userId: user.id,
            email: user.email,
            tier: user.tier,
            type: 'refresh',
        };

        const accessToken = jwt.sign(accessPayload, config.jwt.secret, {
            expiresIn: config.jwt.accessExpiry,
        });

        const refreshToken = jwt.sign(refreshPayload, config.jwt.secret, {
            expiresIn: config.jwt.refreshExpiry,
        });

        // Calculate expiry
        const expiresInMs = this.parseExpiry(config.jwt.refreshExpiry);
        const expiresAt = new Date(Date.now() + expiresInMs);

        // Store refresh token
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: refreshToken,
                expiresAt,
            },
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: this.parseExpiry(config.jwt.accessExpiry) / 1000,
        };
    }

    private parseExpiry(expiry: string): number {
        const match = expiry.match(/^(\d+)(m|h|d)$/);
        if (!match) return 15 * 60 * 1000; // Default 15 minutes

        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return 15 * 60 * 1000;
        }
    }

    private toUserResponse(user: User): UserResponse {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            tier: user.tier,
            emailVerified: user.emailVerified,
            createdAt: user.createdAt,
        };
    }
}

export const authService = new AuthService();
