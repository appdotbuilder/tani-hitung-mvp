import { z } from 'zod';

// User schemas
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const createUserInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Calculator schemas
export const calculatorCategorySchema = z.enum(["farming", "livestock"]);
export type CalculatorCategory = z.infer<typeof calculatorCategorySchema>;

export const calculatorSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  category: calculatorCategorySchema,
  unitLabel: z.string(),
  formulaKey: z.string(),
  createdAt: z.coerce.date()
});

export type Calculator = z.infer<typeof calculatorSchema>;

export const createCalculatorInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  category: calculatorCategorySchema,
  unitLabel: z.string().min(1, "Unit label is required"),
  formulaKey: z.string().min(1, "Formula key is required")
});

export type CreateCalculatorInput = z.infer<typeof createCalculatorInputSchema>;

// Calculation result schemas
export const calculationResultSchema = z.object({
  id: z.number(),
  userId: z.number().nullable(),
  calculatorId: z.number(),
  inputJson: z.record(z.any()), // JSON object for flexible input storage
  resultValue: z.number(),
  unitLabel: z.string(),
  createdAt: z.coerce.date()
});

export type CalculationResult = z.infer<typeof calculationResultSchema>;

export const saveResultInputSchema = z.object({
  userId: z.number(),
  calculatorId: z.number(),
  inputJson: z.record(z.any()),
  resultValue: z.number(),
  unitLabel: z.string()
});

export type SaveResultInput = z.infer<typeof saveResultInputSchema>;

// Calculator-specific input schemas
export const fertilizerRequirementInputSchema = z.object({
  areaHa: z.number().positive("Enter a number greater than 0 for area (ha)"),
  doseKgPerHa: z.number().positive("Enter a number greater than 0 for dose per hectare").default(100)
});

export type FertilizerRequirementInput = z.infer<typeof fertilizerRequirementInputSchema>;

export const chickenFeedDailyInputSchema = z.object({
  chickenCount: z.number().int().positive("Enter a number greater than 0 for chicken count"),
  feedKgPerChickenPerDay: z.number().positive("Enter a number greater than 0 for feed per chicken").default(0.12)
});

export type ChickenFeedDailyInput = z.infer<typeof chickenFeedDailyInputSchema>;

export const livestockMedicineDosageInputSchema = z.object({
  weightKg: z.number().positive("Enter a number greater than 0 for weight (kg)"),
  doseMgPerKg: z.number().positive("Enter a number greater than 0 for dose per kg"),
  concentrationMgPerMl: z.number().positive("Enter a number greater than 0 for concentration").optional()
});

export type LivestockMedicineDosageInput = z.infer<typeof livestockMedicineDosageInputSchema>;

export const harvestEstimationInputSchema = z.object({
  areaHa: z.number().positive("Enter a number greater than 0 for area (ha)"),
  yieldTonPerHa: z.number().positive("Enter a number greater than 0 for yield per hectare").default(5)
});

export type HarvestEstimationInput = z.infer<typeof harvestEstimationInputSchema>;

export const plantingCostInputSchema = z.object({
  areaHa: z.number().positive("Enter a number greater than 0 for area (ha)"),
  costRpPerHa: z.number().positive("Enter a number greater than 0 for cost per hectare").default(1_000_000)
});

export type PlantingCostInput = z.infer<typeof plantingCostInputSchema>;

// Generic calculation input/output schemas
export const calculationInputSchema = z.record(z.any());
export type CalculationInput = z.infer<typeof calculationInputSchema>;

export const calculationOutputSchema = z.object({
  resultValue: z.number(),
  unitLabel: z.string(),
  additionalResults: z.record(z.any()).optional()
});

export type CalculationOutput = z.infer<typeof calculationOutputSchema>;

// Dashboard and history schemas
export const getUserHistoryInputSchema = z.object({
  userId: z.number()
});

export type GetUserHistoryInput = z.infer<typeof getUserHistoryInputSchema>;

export const deleteResultInputSchema = z.object({
  userId: z.number(),
  resultId: z.number()
});

export type DeleteResultInput = z.infer<typeof deleteResultInputSchema>;

export const exportHistoryInputSchema = z.object({
  userId: z.number()
});

export type ExportHistoryInput = z.infer<typeof exportHistoryInputSchema>;