import { serial, text, pgTable, timestamp, numeric, integer, pgEnum, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for calculator categories
export const calculatorCategoryEnum = pgEnum('calculator_category', ['farming', 'livestock']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Calculators table
export const calculatorsTable = pgTable('calculators', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  category: calculatorCategoryEnum('category').notNull(),
  unitLabel: text('unit_label').notNull(),
  formulaKey: text('formula_key').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Calculation results table
export const resultsTable = pgTable('results', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'), // Nullable for guest calculations that get saved later
  calculatorId: integer('calculator_id').notNull().references(() => calculatorsTable.id),
  inputJson: json('input_json').notNull(), // Store calculation inputs as JSON
  resultValue: numeric('result_value', { precision: 15, scale: 4 }).notNull(), // High precision for various calculations
  unitLabel: text('unit_label').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  results: many(resultsTable),
}));

export const calculatorsRelations = relations(calculatorsTable, ({ many }) => ({
  results: many(resultsTable),
}));

export const resultsRelations = relations(resultsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [resultsTable.userId],
    references: [usersTable.id],
  }),
  calculator: one(calculatorsTable, {
    fields: [resultsTable.calculatorId],
    references: [calculatorsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Calculator = typeof calculatorsTable.$inferSelect;
export type NewCalculator = typeof calculatorsTable.$inferInsert;

export type Result = typeof resultsTable.$inferSelect;
export type NewResult = typeof resultsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  calculators: calculatorsTable,
  results: resultsTable,
};