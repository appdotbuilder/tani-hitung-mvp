import { db } from '../db';
import { resultsTable } from '../db/schema';
import { type GetUserHistoryInput, type CalculationResult } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getUserHistory = async (input: GetUserHistoryInput): Promise<CalculationResult[]> => {
  try {
    // Query all calculation results for the user, ordered by newest first
    const results = await db.select()
      .from(resultsTable)
      .where(eq(resultsTable.userId, input.userId))
      .orderBy(desc(resultsTable.createdAt))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(result => ({
      ...result,
      resultValue: parseFloat(result.resultValue), // Convert string back to number
      userId: result.userId!, // We know this is not null since we filtered by userId
      inputJson: result.inputJson as Record<string, any>, // Cast inputJson to proper type
    }));
  } catch (error) {
    console.error('Get user history failed:', error);
    throw error;
  }
};