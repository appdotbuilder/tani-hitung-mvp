import { db } from '../db';
import { resultsTable, usersTable, calculatorsTable } from '../db/schema';
import { type SaveResultInput, type CalculationResult } from '../schema';
import { eq } from 'drizzle-orm';

export async function saveResult(input: SaveResultInput): Promise<CalculationResult> {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.userId))
      .execute();
    
    if (user.length === 0) {
      throw new Error(`User with ID ${input.userId} not found`);
    }

    // Verify calculator exists
    const calculator = await db.select()
      .from(calculatorsTable)
      .where(eq(calculatorsTable.id, input.calculatorId))
      .execute();
    
    if (calculator.length === 0) {
      throw new Error(`Calculator with ID ${input.calculatorId} not found`);
    }

    // Insert calculation result
    const result = await db.insert(resultsTable)
      .values({
        userId: input.userId,
        calculatorId: input.calculatorId,
        inputJson: input.inputJson,
        resultValue: input.resultValue.toString(), // Convert number to string for numeric column
        unitLabel: input.unitLabel
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers and cast inputJson type before returning
    const savedResult = result[0];
    return {
      ...savedResult,
      inputJson: savedResult.inputJson as Record<string, any>, // Cast JSON type
      resultValue: parseFloat(savedResult.resultValue) // Convert string back to number
    };
  } catch (error) {
    console.error('Save result failed:', error);
    throw error;
  }
}