import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors.js';

export const validate = <T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params' = 'body') => {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            const data = req[source];
            const validated = schema.parse(data);

            // Replace with validated data
            (req as Record<string, unknown>)[source] = validated;

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
                next(new ValidationError(messages.join(', ')));
            } else {
                next(error);
            }
        }
    };
};

// Common validation helpers
export const validateBody = <T>(schema: ZodSchema<T>) => validate(schema, 'body');
export const validateQuery = <T>(schema: ZodSchema<T>) => validate(schema, 'query');
export const validateParams = <T>(schema: ZodSchema<T>) => validate(schema, 'params');
