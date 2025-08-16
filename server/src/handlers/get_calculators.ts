import { db } from '../db';
import { calculatorsTable } from '../db/schema';
import { type Calculator, type CalculatorCategory } from '../schema';
import { eq } from 'drizzle-orm';

export const getCalculators = async (category?: CalculatorCategory): Promise<Calculator[]> => {
  try {
    // Build query with conditional where clause
    const query = category 
      ? db.select().from(calculatorsTable).where(eq(calculatorsTable.category, category))
      : db.select().from(calculatorsTable);

    const results = await query.execute();

    // Transform database results to match schema types
    return results.map(calculator => ({
      id: calculator.id,
      name: calculator.name,
      slug: calculator.slug,
      description: calculator.description,
      category: calculator.category as CalculatorCategory,
      unitLabel: calculator.unitLabel,
      formulaKey: calculator.formulaKey,
      createdAt: calculator.createdAt
    }));
  } catch (error) {
    console.error('Failed to fetch calculators:', error);
    throw error;
  }
};