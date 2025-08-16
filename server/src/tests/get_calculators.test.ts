import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { calculatorsTable } from '../db/schema';
import { type CreateCalculatorInput } from '../schema';
import { getCalculators } from '../handlers/get_calculators';

// Test calculator data
const farmingCalculator: CreateCalculatorInput = {
  name: 'Fertilizer Requirement',
  slug: 'fertilizer-requirement',
  description: 'Calculate fertilizer needed for your farm area',
  category: 'farming',
  unitLabel: 'kg',
  formulaKey: 'fertilizer_requirement'
};

const livestockCalculator: CreateCalculatorInput = {
  name: 'Chicken Feed Daily',
  slug: 'chicken-feed-daily',
  description: 'Calculate daily feed requirement for chickens',
  category: 'livestock',
  unitLabel: 'kg/day',
  formulaKey: 'chicken_feed_daily'
};

const anotherFarmingCalculator: CreateCalculatorInput = {
  name: 'Harvest Estimation',
  slug: 'harvest-estimation',
  description: 'Estimate harvest yield for your crops',
  category: 'farming',
  unitLabel: 'tons',
  formulaKey: 'harvest_estimation'
};

describe('getCalculators', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no calculators exist', async () => {
    const result = await getCalculators();

    expect(result).toEqual([]);
  });

  it('should return all calculators when no category filter is provided', async () => {
    // Insert test calculators
    await db.insert(calculatorsTable)
      .values([farmingCalculator, livestockCalculator, anotherFarmingCalculator])
      .execute();

    const result = await getCalculators();

    expect(result).toHaveLength(3);
    
    // Verify all calculators are returned
    expect(result.map(c => c.slug)).toContain('fertilizer-requirement');
    expect(result.map(c => c.slug)).toContain('chicken-feed-daily');
    expect(result.map(c => c.slug)).toContain('harvest-estimation');

    // Verify structure of returned data
    result.forEach(calculator => {
      expect(calculator.id).toBeDefined();
      expect(typeof calculator.id).toBe('number');
      expect(calculator.name).toBeDefined();
      expect(calculator.slug).toBeDefined();
      expect(calculator.description).toBeDefined();
      expect(calculator.category).toBeDefined();
      expect(['farming', 'livestock']).toContain(calculator.category);
      expect(calculator.unitLabel).toBeDefined();
      expect(calculator.formulaKey).toBeDefined();
      expect(calculator.createdAt).toBeInstanceOf(Date);
    });
  });

  it('should filter calculators by farming category', async () => {
    // Insert test calculators
    await db.insert(calculatorsTable)
      .values([farmingCalculator, livestockCalculator, anotherFarmingCalculator])
      .execute();

    const result = await getCalculators('farming');

    expect(result).toHaveLength(2);
    
    // Verify only farming calculators are returned
    result.forEach(calculator => {
      expect(calculator.category).toBe('farming');
    });

    const slugs = result.map(c => c.slug);
    expect(slugs).toContain('fertilizer-requirement');
    expect(slugs).toContain('harvest-estimation');
    expect(slugs).not.toContain('chicken-feed-daily');
  });

  it('should filter calculators by livestock category', async () => {
    // Insert test calculators
    await db.insert(calculatorsTable)
      .values([farmingCalculator, livestockCalculator, anotherFarmingCalculator])
      .execute();

    const result = await getCalculators('livestock');

    expect(result).toHaveLength(1);
    
    // Verify only livestock calculators are returned
    result.forEach(calculator => {
      expect(calculator.category).toBe('livestock');
    });

    const slugs = result.map(c => c.slug);
    expect(slugs).toContain('chicken-feed-daily');
    expect(slugs).not.toContain('fertilizer-requirement');
    expect(slugs).not.toContain('harvest-estimation');
  });

  it('should return empty array when filtering by category with no matches', async () => {
    // Insert only farming calculators
    await db.insert(calculatorsTable)
      .values([farmingCalculator, anotherFarmingCalculator])
      .execute();

    const result = await getCalculators('livestock');

    expect(result).toEqual([]);
  });

  it('should return calculators with correct field types and values', async () => {
    // Insert a single calculator for detailed testing
    await db.insert(calculatorsTable)
      .values([farmingCalculator])
      .execute();

    const result = await getCalculators();

    expect(result).toHaveLength(1);
    
    const calculator = result[0];
    expect(calculator.name).toBe('Fertilizer Requirement');
    expect(calculator.slug).toBe('fertilizer-requirement');
    expect(calculator.description).toBe('Calculate fertilizer needed for your farm area');
    expect(calculator.category).toBe('farming');
    expect(calculator.unitLabel).toBe('kg');
    expect(calculator.formulaKey).toBe('fertilizer_requirement');
    expect(typeof calculator.id).toBe('number');
    expect(calculator.id).toBeGreaterThan(0);
    expect(calculator.createdAt).toBeInstanceOf(Date);
  });

  it('should handle database queries correctly with proper ordering', async () => {
    // Insert calculators in a specific order
    await db.insert(calculatorsTable)
      .values([
        { ...farmingCalculator, name: 'Z Calculator' },
        { ...livestockCalculator, name: 'A Calculator' },
        { ...anotherFarmingCalculator, name: 'M Calculator' }
      ])
      .execute();

    const result = await getCalculators();

    expect(result).toHaveLength(3);
    
    // Results should maintain database order (by id, typically)
    expect(result[0].name).toBe('Z Calculator');
    expect(result[1].name).toBe('A Calculator');
    expect(result[2].name).toBe('M Calculator');
  });
});