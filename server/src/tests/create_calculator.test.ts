import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { calculatorsTable } from '../db/schema';
import { type CreateCalculatorInput } from '../schema';
import { createCalculator } from '../handlers/create_calculator';
import { eq } from 'drizzle-orm';

// Test input for farming calculator
const testFarmingInput: CreateCalculatorInput = {
  name: 'Fertilizer Calculator',
  slug: 'fertilizer-calc',
  description: 'Calculate fertilizer requirements for crops',
  category: 'farming',
  unitLabel: 'kg',
  formulaKey: 'fertilizer_requirement'
};

// Test input for livestock calculator
const testLivestockInput: CreateCalculatorInput = {
  name: 'Feed Calculator',
  slug: 'feed-calc',
  description: 'Calculate daily feed requirements',
  category: 'livestock',
  unitLabel: 'kg/day',
  formulaKey: 'feed_daily'
};

describe('createCalculator', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a farming calculator', async () => {
    const result = await createCalculator(testFarmingInput);

    // Basic field validation
    expect(result.name).toEqual('Fertilizer Calculator');
    expect(result.slug).toEqual('fertilizer-calc');
    expect(result.description).toEqual('Calculate fertilizer requirements for crops');
    expect(result.category).toEqual('farming');
    expect(result.unitLabel).toEqual('kg');
    expect(result.formulaKey).toEqual('fertilizer_requirement');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should create a livestock calculator', async () => {
    const result = await createCalculator(testLivestockInput);

    // Basic field validation
    expect(result.name).toEqual('Feed Calculator');
    expect(result.slug).toEqual('feed-calc');
    expect(result.description).toEqual('Calculate daily feed requirements');
    expect(result.category).toEqual('livestock');
    expect(result.unitLabel).toEqual('kg/day');
    expect(result.formulaKey).toEqual('feed_daily');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should save calculator to database', async () => {
    const result = await createCalculator(testFarmingInput);

    // Query using proper drizzle syntax
    const calculators = await db.select()
      .from(calculatorsTable)
      .where(eq(calculatorsTable.id, result.id))
      .execute();

    expect(calculators).toHaveLength(1);
    expect(calculators[0].name).toEqual('Fertilizer Calculator');
    expect(calculators[0].slug).toEqual('fertilizer-calc');
    expect(calculators[0].description).toEqual('Calculate fertilizer requirements for crops');
    expect(calculators[0].category).toEqual('farming');
    expect(calculators[0].unitLabel).toEqual('kg');
    expect(calculators[0].formulaKey).toEqual('fertilizer_requirement');
    expect(calculators[0].createdAt).toBeInstanceOf(Date);
  });

  it('should create multiple calculators with different slugs', async () => {
    // Create first calculator
    const result1 = await createCalculator(testFarmingInput);
    
    // Create second calculator with different slug
    const result2 = await createCalculator(testLivestockInput);

    // Verify both are created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.slug).toEqual('fertilizer-calc');
    expect(result2.slug).toEqual('feed-calc');

    // Verify both exist in database
    const calculators = await db.select()
      .from(calculatorsTable)
      .execute();

    expect(calculators).toHaveLength(2);
    
    const slugs = calculators.map(c => c.slug);
    expect(slugs).toContain('fertilizer-calc');
    expect(slugs).toContain('feed-calc');
  });

  it('should handle unique slug constraint violation', async () => {
    // Create first calculator
    await createCalculator(testFarmingInput);

    // Attempt to create another calculator with same slug
    const duplicateInput: CreateCalculatorInput = {
      ...testFarmingInput,
      name: 'Different Name'
    };

    // Should throw error due to unique constraint on slug
    await expect(createCalculator(duplicateInput))
      .rejects.toThrow(/unique/i);
  });

  it('should create calculators with special characters in description', async () => {
    const specialInput: CreateCalculatorInput = {
      name: 'Special Calculator',
      slug: 'special-calc',
      description: 'Calculate with ñ, é, and 特殊 characters & symbols!',
      category: 'farming',
      unitLabel: 'm³',
      formulaKey: 'special_formula'
    };

    const result = await createCalculator(specialInput);

    expect(result.description).toEqual('Calculate with ñ, é, and 特殊 characters & symbols!');
    expect(result.unitLabel).toEqual('m³');

    // Verify in database
    const calculators = await db.select()
      .from(calculatorsTable)
      .where(eq(calculatorsTable.id, result.id))
      .execute();

    expect(calculators[0].description).toEqual('Calculate with ñ, é, and 特殊 characters & symbols!');
    expect(calculators[0].unitLabel).toEqual('m³');
  });
});