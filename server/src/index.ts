import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  loginInputSchema,
  calculatorCategorySchema,
  calculationInputSchema,
  saveResultInputSchema,
  getUserHistoryInputSchema,
  deleteResultInputSchema,
  exportHistoryInputSchema,
  createCalculatorInputSchema,
  fertilizerRequirementInputSchema,
  chickenFeedDailyInputSchema,
  livestockMedicineDosageInputSchema,
  harvestEstimationInputSchema,
  plantingCostInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { getCalculators } from './handlers/get_calculators';
import { getCalculatorBySlug } from './handlers/get_calculator_by_slug';
import { calculate } from './handlers/calculate';
import { saveResult } from './handlers/save_result';
import { getUserHistory } from './handlers/get_user_history';
import { deleteResult } from './handlers/delete_result';
import { exportHistoryCSV } from './handlers/export_history_csv';
import { createCalculator } from './handlers/create_calculator';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User authentication routes
  register: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Calculator management routes
  getCalculators: publicProcedure
    .input(z.object({ category: calculatorCategorySchema.optional() }).optional())
    .query(({ input }) => getCalculators(input?.category)),

  getCalculatorBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getCalculatorBySlug(input.slug)),

  createCalculator: publicProcedure
    .input(createCalculatorInputSchema)
    .mutation(({ input }) => createCalculator(input)),

  // Calculation routes (no authentication required for basic calculations)
  calculate: publicProcedure
    .input(z.object({
      slug: z.string(),
      input: calculationInputSchema
    }))
    .mutation(({ input }) => calculate(input.slug, input.input)),

  // Calculator-specific validation endpoints
  validateFertilizerInput: publicProcedure
    .input(fertilizerRequirementInputSchema)
    .query(({ input }) => ({ valid: true, input })),

  validateChickenFeedInput: publicProcedure
    .input(chickenFeedDailyInputSchema)
    .query(({ input }) => ({ valid: true, input })),

  validateMedicineDosageInput: publicProcedure
    .input(livestockMedicineDosageInputSchema)
    .query(({ input }) => ({ valid: true, input })),

  validateHarvestEstimationInput: publicProcedure
    .input(harvestEstimationInputSchema)
    .query(({ input }) => ({ valid: true, input })),

  validatePlantingCostInput: publicProcedure
    .input(plantingCostInputSchema)
    .query(({ input }) => ({ valid: true, input })),

  // User history and result management (requires authentication)
  saveResult: publicProcedure
    .input(saveResultInputSchema)
    .mutation(({ input }) => saveResult(input)),

  getUserHistory: publicProcedure
    .input(getUserHistoryInputSchema)
    .query(({ input }) => getUserHistory(input)),

  deleteResult: publicProcedure
    .input(deleteResultInputSchema)
    .mutation(({ input }) => deleteResult(input)),

  exportHistoryCSV: publicProcedure
    .input(exportHistoryInputSchema)
    .query(({ input }) => exportHistoryCSV(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors({
        origin: process.env['CLIENT_URL'] || 'http://localhost:3000',
        credentials: true
      })(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  
  server.listen(port);
  console.log(`TaniHitung TRPC server listening at port: ${port}`);
  console.log(`Available routes:
  - POST /healthcheck
  - POST /register
  - POST /login
  - POST /getCalculators
  - POST /getCalculatorBySlug
  - POST /calculate
  - POST /saveResult
  - POST /getUserHistory
  - POST /deleteResult
  - POST /exportHistoryCSV
  `);
}

start().catch(console.error);