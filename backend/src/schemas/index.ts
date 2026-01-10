import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1).max(100).optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

// User update schemas
export const updateUserSchema = z.object({
    name: z.string().min(1).max(100).optional(),
});

// Search config schemas
export const createSearchConfigSchema = z.object({
    serviceId: z.string().uuid(),
    name: z.string().min(1).max(100),
    keywords: z.array(z.string()).default([]),
    priceMin: z.number().int().positive().optional(),
    priceMax: z.number().int().positive().optional(),
    location: z.string().max(100).optional(),
    customFilters: z.record(z.any()).optional(),
    intervalSeconds: z.number().int().min(30).max(86400).default(60),
    randomRangeSeconds: z.number().int().min(0).max(300).default(15),
});

export const updateSearchConfigSchema = createSearchConfigSchema.partial().omit({ serviceId: true });

// Service credential schemas
export const storeCredentialsSchema = z.object({
    username: z.string().min(1),
    password: z.string().min(1),
});

// Listing schemas
export const listListingsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    serviceId: z.string().uuid().optional(),
    searchConfigId: z.string().uuid().optional(),
    minPrice: z.coerce.number().int().positive().optional(),
    maxPrice: z.coerce.number().int().positive().optional(),
});

// Notification schemas
export const listNotificationsQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED']).optional(),
    unreadOnly: z.coerce.boolean().optional(),
});

// Device schemas
export const registerDeviceSchema = z.object({
    deviceToken: z.string().min(1),
    platform: z.enum(['IOS', 'ANDROID']),
    deviceName: z.string().max(100).optional(),
});

// Pagination helpers
export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const uuidParamSchema = z.object({
    id: z.string().uuid(),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSearchConfigInput = z.infer<typeof createSearchConfigSchema>;
export type UpdateSearchConfigInput = z.infer<typeof updateSearchConfigSchema>;
export type StoreCredentialsInput = z.infer<typeof storeCredentialsSchema>;
export type RegisterDeviceInput = z.infer<typeof registerDeviceSchema>;
