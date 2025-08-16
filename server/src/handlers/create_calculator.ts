import { db } from '../db';
import { calculatorsTable } from '../db/schema';
import { type CreateCalculatorInput, type Calculator } from '../schema';

export const createCalculator = async (input: CreateCalculatorInput): Promise<Calculator> => {
  try {
    // Insert calculator record
    const result = await db.insert(calculatorsTable)
      .values({
        name: input.name,
        slug: input.slug,
        description: input.description,
        category: input.category,
        unitLabel: input.unitLabel,
        formulaKey: input.formulaKey
      })
      .returning()
      .execute();

    // Return the created calculator
    const calculator = result[0];
    return {
      ...calculator,
      createdAt: calculator.createdAt
    };
  } catch (error) {
    console.error('Calculator creation failed:', error);
    throw error;
  }
};