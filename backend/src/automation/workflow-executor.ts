// @ts-nocheck - Playwright uses DOM types
import { Page } from 'playwright';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export interface WorkflowStep {
    id?: string;
    stepOrder: number;
    actionType: 'navigate' | 'click' | 'fill' | 'wait' | 'extract' | 'screenshot' | 'scroll';
    cssSelector?: string;
    xpathSelector?: string;
    parameters: Record<string, unknown>;
    validationRules?: Record<string, unknown>;
    errorRecovery?: Record<string, unknown>;
}

export interface Workflow {
    id: string;
    name: string;
    serviceId: string;
    steps: WorkflowStep[];
    version: number;
}

export interface ExecutionContext {
    variables: Record<string, string | number | null>;
    results: Record<string, unknown>;
    screenshots: string[];
    logs: string[];
}

export class WorkflowExecutor {
    private page: Page;
    private context: ExecutionContext;
    private maxRetries = 3;

    constructor(page: Page) {
        this.page = page;
        this.context = {
            variables: {},
            results: {},
            screenshots: [],
            logs: [],
        };
    }

    setVariables(variables: Record<string, string | number | null>): void {
        this.context.variables = { ...this.context.variables, ...variables };
    }

    async execute(workflow: Workflow): Promise<ExecutionContext> {
        logger.info(`Executing workflow: ${workflow.name}`);
        this.log(`Starting workflow: ${workflow.name}`);

        const sortedSteps = [...workflow.steps].sort((a, b) => a.stepOrder - b.stepOrder);

        for (const step of sortedSteps) {
            let success = false;
            let lastError: Error | null = null;

            for (let attempt = 1; attempt <= this.maxRetries && !success; attempt++) {
                try {
                    await this.executeStep(step);
                    success = true;
                    this.log(`Step ${step.stepOrder} (${step.actionType}) completed`);
                } catch (error) {
                    lastError = error as Error;
                    logger.warn(`Step ${step.stepOrder} failed (attempt ${attempt}/${this.maxRetries}):`, error);

                    if (attempt < this.maxRetries) {
                        await this.handleErrorRecovery(step);
                        await this.delay(1000 * attempt);
                    }
                }
            }

            if (!success && lastError) {
                this.log(`Step ${step.stepOrder} failed after ${this.maxRetries} attempts: ${lastError.message}`);

                // Take failure screenshot
                await this.takeScreenshot(`failure_step_${step.stepOrder}`);

                throw new Error(`Workflow failed at step ${step.stepOrder}: ${lastError.message}`);
            }
        }

        this.log('Workflow completed successfully');
        return this.context;
    }

    private async executeStep(step: WorkflowStep): Promise<void> {
        const params = this.interpolateParameters(step.parameters);
        const selector = step.cssSelector || step.xpathSelector;

        switch (step.actionType) {
            case 'navigate':
                await this.page.goto(params.url as string, {
                    waitUntil: 'domcontentloaded',
                    timeout: params.timeout as number || 30000
                });
                break;

            case 'click':
                if (selector) {
                    await this.page.click(selector, { timeout: 10000 });
                }
                break;

            case 'fill':
                if (selector && params.value !== undefined) {
                    await this.page.fill(selector, String(params.value));
                }
                break;

            case 'wait':
                if (params.duration) {
                    await this.delay(params.duration as number);
                } else if (selector) {
                    await this.page.waitForSelector(selector, { timeout: 15000 });
                }
                break;

            case 'scroll':
                await this.page.evaluate((amount) => {
                    window.scrollBy(0, amount || 500);
                }, params.amount as number);
                await this.delay(500);
                break;

            case 'extract':
                if (selector) {
                    const elements = await this.page.$$(selector);
                    const extracted = await Promise.all(
                        elements.map(async (el) => {
                            const text = await el.textContent();
                            const href = await el.getAttribute('href');
                            return { text, href };
                        })
                    );
                    this.context.results[params.key as string || 'extracted'] = extracted;
                }
                break;

            case 'screenshot':
                await this.takeScreenshot(params.name as string || 'step');
                break;

            default:
                logger.warn(`Unknown action type: ${step.actionType}`);
        }
    }

    private interpolateParameters(params: Record<string, unknown>): Record<string, unknown> {
        const result: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(params)) {
            if (typeof value === 'string') {
                result[key] = value.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
                    const varValue = this.context.variables[varName];
                    return varValue !== null && varValue !== undefined ? String(varValue) : '';
                });
            } else {
                result[key] = value;
            }
        }

        return result;
    }

    private async handleErrorRecovery(step: WorkflowStep): Promise<void> {
        const recovery = step.errorRecovery;

        if (recovery?.scrollAndRetry) {
            await this.page.evaluate(() => window.scrollBy(0, 200));
        }

        if (recovery?.dismissPopup) {
            try {
                await this.page.click('[class*="close"], [class*="dismiss"], button:has-text("OK")');
            } catch {
                // No popup to dismiss
            }
        }
    }

    private async takeScreenshot(name: string): Promise<void> {
        try {
            const buffer = await this.page.screenshot({ fullPage: false });
            const base64 = buffer.toString('base64');
            this.context.screenshots.push(`data:image/png;base64,${base64}`);
        } catch (error) {
            logger.error('Failed to take screenshot:', error);
        }
    }

    private log(message: string): void {
        const timestamp = new Date().toISOString();
        this.context.logs.push(`[${timestamp}] ${message}`);
        logger.debug(message);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export async function getWorkflowById(workflowId: string): Promise<Workflow | null> {
    const workflow = await prisma.automationWorkflow.findUnique({
        where: { id: workflowId },
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    if (!workflow) return null;

    return {
        id: workflow.id,
        name: workflow.name,
        serviceId: workflow.serviceId,
        version: workflow.version,
        steps: workflow.steps.map(s => ({
            id: s.id,
            stepOrder: s.stepOrder,
            actionType: s.actionType as WorkflowStep['actionType'],
            cssSelector: s.cssSelector || undefined,
            xpathSelector: s.xpathSelector || undefined,
            parameters: s.parameters as Record<string, unknown> || {},
            validationRules: s.validationRules as Record<string, unknown> || undefined,
            errorRecovery: s.errorRecovery as Record<string, unknown> || undefined,
        })),
    };
}
