import { db } from '../db';
import { resultsTable } from '../db/schema';
import { type DeleteResultInput } from '../schema';
import { eq, and } from 'drizzle-orm';

export const deleteResult = async (input: DeleteResultInput): Promise<boolean> => {
  try {
    // Delete the result only if it belongs to the specified user
    const result = await db.delete(resultsTable)
      .where(
        and(
          eq(resultsTable.id, input.resultId),
          eq(resultsTable.userId, input.userId)
        )
      )
      .returning({ id: resultsTable.id })
      .execute();

    // Return true if a record was deleted, false if no matching record was found
    return result.length > 0;
  } catch (error) {
    console.error('Result deletion failed:', error);
    throw error;
  }
};