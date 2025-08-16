import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { calculatorsTable } from '../db/schema';
import { type CreateCalculatorInput } from '../schema';
import { getCalculatorBySlug } from '../handlers/get_calculator_by_slug';

// Test calculator data
const testCalculator: CreateCalculatorInput = {
  name: 'Fertilizer Requirement',
  slug: 'fertilizer-requirement',
  description: 'Calculate fertilizer needed for your farm area',
  category: 'farming',
  unitLabel: 'kg',
  formulaKey: 'fertilizer_requirement'
};

const anotherCalculator: CreateCalculatorInput = {
  name: 'Chicken Feed Calculator',
  slug: 'chicken-feed-daily',
  description: 'Calculate daily feed requirements for chickens',
  category: 'livestock',
  unitLabel: 'kg/day',
  formulaKey: 'chicken_feed_daily'
};

describe('getCalculatorBySlug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return calculator when slug exists', async () => {
    // Create test calculator
    await db.insert(calculatorsTable)
      .values(testCalculator)
      .execute();

    const result = await getCalculatorBySlug('fertilizer-requirement');

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Fertilizer Requirement');
    expect(result!.slug).toEqual('fertilizer-requirement');
    expect(result!.description).toEqual(testCalculator.description);
    expect(result!.category).toEqual('farming');
    expect(result!.unitLabel).toEqual('kg');
    expect(result!.formulaKey).toEqual('fertilizer_requirement');
    expect(result!.id).toBeDefined();
    expect(result!.createdAt).toBeInstanceOf(Date);
  });

  it('should return null when slug does not exist', async () => {
    // Create one calculator but search for different slug
    await db.insert(calculatorsTable)
      .values(testCalculator)
      .execute();

    const result = await getCalculatorBySlug('non-existent-slug');

    expect(result).toBeNull();
  });

  it('should return correct calculator when multiple calculators exist', async () => {
    // Create multiple calculators
    await db.insert(calculatorsTable)
      .values([testCalculator, anotherCalculator])
      .execute();

    const result = await getCalculatorBySlug('chicken-feed-daily');

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Chicken Feed Calculator');
    expect(result!.slug).toEqual('chicken-feed-daily');
    expect(result!.category).toEqual('livestock');
    expect(result!.unitLabel).toEqual('kg/day');
    expect(result!.formulaKey).toEqual('chicken_feed_daily');
  });

  it('should handle empty slug gracefully', async () => {
    await db.insert(calculatorsTable)
      .values(testCalculator)
      .execute();

    const result = await getCalculatorBySlug('');

    expect(result).toBeNull();
  });

  it('should perform case-sensitive slug matching', async () => {
    await db.insert(calculatorsTable)
      .values(testCalculator)
      .execute();

    // Test with different case
    const result = await getCalculatorBySlug('FERTILIZER-REQUIREMENT');

    expect(result).toBeNull();
  });

  it('should return calculator with all required fields populated', async () => {
    const fullCalculator: CreateCalculatorInput = {
      name: 'Harvest Estimation',
      slug: 'harvest-estimation',
      description: 'Estimate your harvest yield based on area and expected yield per hectare',
      category: 'farming',
      unitLabel: 'tons',
      formulaKey: 'harvest_estimation'
    };

    await db.insert(calculatorsTable)
      .values(fullCalculator)
      .execute();

    const result = await getCalculatorBySlug('harvest-estimation');

    expect(result).not.toBeNull();
    
    // Verify all fields are present and correct type
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.name).toBe('string');
    expect(typeof result!.slug).toBe('string');
    expect(typeof result!.description).toBe('string');
    expect(typeof result!.category).toBe('string');
    expect(typeof result!.unitLabel).toBe('string');
    expect(typeof result!.formulaKey).toBe('string');
    expect(result!.createdAt).toBeInstanceOf(Date);
    
    // Verify specific values
    expect(result!.name).toEqual('Harvest Estimation');
    expect(result!.slug).toEqual('harvest-estimation');
    expect(result!.description).toEqual(fullCalculator.description);
    expect(result!.category).toEqual('farming');
    expect(result!.unitLabel).toEqual('tons');
    expect(result!.formulaKey).toEqual('harvest_estimation');
  });
});