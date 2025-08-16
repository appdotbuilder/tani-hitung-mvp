import { db } from '../db';
import { calculatorsTable } from '../db/schema';
import { type Calculator } from '../schema';
import { eq } from 'drizzle-orm';

export const getCalculatorBySlug = async (slug: string): Promise<Calculator | null> => {
  try {
    const results = await db.select()
      .from(calculatorsTable)
      .where(eq(calculatorsTable.slug, slug))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const calculator = results[0];
    return {
      id: calculator.id,
      name: calculator.name,
      slug: calculator.slug,
      description: calculator.description,
      category: calculator.category,
      unitLabel: calculator.unitLabel,
      formulaKey: calculator.formulaKey,
      createdAt: calculator.createdAt
    };
  } catch (error) {
    console.error('Get calculator by slug failed:', error);
    throw error;
  }
};