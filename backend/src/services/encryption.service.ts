import crypto from 'crypto';
import { config } from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const AUTH_TAG_LENGTH = 16;

export interface EncryptedData {
    encrypted: Buffer;
    iv: Buffer;
    authTag: Buffer;
}

class EncryptionService {
    private key: Buffer;

    constructor() {
        this.key = Buffer.from(config.encryption.key, 'utf8');

        if (this.key.length !== 32) {
            throw new Error('Encryption key must be exactly 32 characters');
        }
    }

    /**
     * Encrypt a string using AES-256-GCM
     */
    encrypt(plaintext: string): EncryptedData {
        const iv = crypto.randomBytes(config.encryption.ivLength);
        const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

        const encrypted = Buffer.concat([
            cipher.update(plaintext, 'utf8'),
            cipher.final(),
        ]);

        const authTag = cipher.getAuthTag();

        return { encrypted, iv, authTag };
    }

    /**
     * Decrypt data encrypted with encrypt()
     */
    decrypt(encrypted: Buffer, iv: Buffer, authTag?: Buffer): string {
        const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);

        if (authTag) {
            decipher.setAuthTag(authTag);
        }

        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
        ]);

        return decrypted.toString('utf8');
    }

    /**
     * Encrypt and encode to base64 for storage
     */
    encryptToBase64(plaintext: string): { encrypted: string; iv: string; authTag: string } {
        const { encrypted, iv, authTag } = this.encrypt(plaintext);

        return {
            encrypted: encrypted.toString('base64'),
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
        };
    }

    /**
     * Decrypt from base64 encoded data
     */
    decryptFromBase64(encrypted: string, iv: string, authTag?: string): string {
        return this.decrypt(
            Buffer.from(encrypted, 'base64'),
            Buffer.from(iv, 'base64'),
            authTag ? Buffer.from(authTag, 'base64') : undefined
        );
    }

    /**
     * Create a deterministic hash for deduplication
     */
    hash(data: string, algorithm: 'md5' | 'sha256' = 'sha256'): string {
        return crypto.createHash(algorithm).update(data).digest('hex');
    }

    /**
     * Create a primary hash for listing deduplication
     * Format: MD5(service_id + external_id)
     */
    createListingPrimaryHash(serviceId: string, externalId: string): string {
        return this.hash(`${serviceId}:${externalId}`, 'md5');
    }

    /**
     * Create a semantic hash for content-based deduplication
     * Format: SHA256(title + price + phone)
     */
    createListingSemanticHash(title: string, price: number | null, phone: string | null): string {
        const normalized = [
            title.toLowerCase().trim(),
            price?.toString() ?? '',
            phone?.replace(/\D/g, '') ?? '',
        ].join('|');

        return this.hash(normalized, 'sha256');
    }

    /**
     * Generate a random token (for refresh tokens, verification codes, etc.)
     */
    generateToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }
}

export const encryptionService = new EncryptionService();
