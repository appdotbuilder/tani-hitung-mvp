import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, calculatorsTable, resultsTable } from '../db/schema';
import { type SaveResultInput } from '../schema';
import { saveResult } from '../handlers/save_result';
import { eq } from 'drizzle-orm';

describe('saveResult', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should save a calculation result', async () => {
    // Create prerequisite user and calculator
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    const calculatorResult = await db.insert(calculatorsTable)
      .values({
        name: 'Fertilizer Calculator',
        slug: 'fertilizer-requirement',
        description: 'Calculate fertilizer requirements',
        category: 'farming',
        unitLabel: 'kg',
        formulaKey: 'fertilizer_requirement'
      })
      .returning()
      .execute();

    const testInput: SaveResultInput = {
      userId: userResult[0].id,
      calculatorId: calculatorResult[0].id,
      inputJson: { areaHa: 10, doseKgPerHa: 100 },
      resultValue: 1000.5,
      unitLabel: 'kg'
    };

    const result = await saveResult(testInput);

    // Basic field validation
    expect(result.userId).toEqual(userResult[0].id);
    expect(result.calculatorId).toEqual(calculatorResult[0].id);
    expect(result.inputJson).toEqual({ areaHa: 10, doseKgPerHa: 100 });
    expect(result.resultValue).toEqual(1000.5);
    expect(typeof result.resultValue).toBe('number');
    expect(result.unitLabel).toEqual('kg');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should save result to database correctly', async () => {
    // Create prerequisite user and calculator
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    const calculatorResult = await db.insert(calculatorsTable)
      .values({
        name: 'Chicken Feed Calculator',
        slug: 'chicken-feed-daily',
        description: 'Calculate daily chicken feed requirements',
        category: 'livestock',
        unitLabel: 'kg',
        formulaKey: 'chicken_feed_daily'
      })
      .returning()
      .execute();

    const testInput: SaveResultInput = {
      userId: userResult[0].id,
      calculatorId: calculatorResult[0].id,
      inputJson: { chickenCount: 50, feedKgPerChickenPerDay: 0.12 },
      resultValue: 6.0,
      unitLabel: 'kg/day'
    };

    const result = await saveResult(testInput);

    // Query database to verify the saved result
    const savedResults = await db.select()
      .from(resultsTable)
      .where(eq(resultsTable.id, result.id))
      .execute();

    expect(savedResults).toHaveLength(1);
    const savedResult = savedResults[0];
    expect(savedResult.userId).toEqual(userResult[0].id);
    expect(savedResult.calculatorId).toEqual(calculatorResult[0].id);
    expect(savedResult.inputJson).toEqual({ chickenCount: 50, feedKgPerChickenPerDay: 0.12 });
    expect(parseFloat(savedResult.resultValue)).toEqual(6.0);
    expect(savedResult.unitLabel).toEqual('kg/day');
    expect(savedResult.createdAt).toBeInstanceOf(Date);
  });

  it('should handle complex calculation inputs and results', async () => {
    // Create prerequisite user and calculator
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    const calculatorResult = await db.insert(calculatorsTable)
      .values({
        name: 'Medicine Dosage Calculator',
        slug: 'livestock-medicine-dosage',
        description: 'Calculate livestock medicine dosage',
        category: 'livestock',
        unitLabel: 'ml',
        formulaKey: 'livestock_medicine_dosage'
      })
      .returning()
      .execute();

    const complexInput: SaveResultInput = {
      userId: userResult[0].id,
      calculatorId: calculatorResult[0].id,
      inputJson: {
        weightKg: 500.25,
        doseMgPerKg: 5.5,
        concentrationMgPerMl: 50,
        animalType: 'cattle',
        additionalNotes: 'Morning dose'
      },
      resultValue: 55.0275,
      unitLabel: 'ml'
    };

    const result = await saveResult(complexInput);

    expect(result.inputJson).toEqual({
      weightKg: 500.25,
      doseMgPerKg: 5.5,
      concentrationMgPerMl: 50,
      animalType: 'cattle',
      additionalNotes: 'Morning dose'
    });
    expect(result.resultValue).toEqual(55.0275);
    expect(result.unitLabel).toEqual('ml');
  });

  it('should throw error when user does not exist', async () => {
    // Create only calculator, not user
    const calculatorResult = await db.insert(calculatorsTable)
      .values({
        name: 'Test Calculator',
        slug: 'test-calculator',
        description: 'Test description',
        category: 'farming',
        unitLabel: 'units',
        formulaKey: 'test_formula'
      })
      .returning()
      .execute();

    const testInput: SaveResultInput = {
      userId: 99999, // Non-existent user ID
      calculatorId: calculatorResult[0].id,
      inputJson: { test: 'data' },
      resultValue: 100,
      unitLabel: 'units'
    };

    await expect(saveResult(testInput)).rejects.toThrow(/User with ID 99999 not found/);
  });

  it('should throw error when calculator does not exist', async () => {
    // Create only user, not calculator
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    const testInput: SaveResultInput = {
      userId: userResult[0].id,
      calculatorId: 99999, // Non-existent calculator ID
      inputJson: { test: 'data' },
      resultValue: 100,
      unitLabel: 'units'
    };

    await expect(saveResult(testInput)).rejects.toThrow(/Calculator with ID 99999 not found/);
  });

  it('should handle high precision numeric values', async () => {
    // Create prerequisite user and calculator
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    const calculatorResult = await db.insert(calculatorsTable)
      .values({
        name: 'Precision Calculator',
        slug: 'precision-calc',
        description: 'High precision calculations',
        category: 'farming',
        unitLabel: 'kg',
        formulaKey: 'precision_formula'
      })
      .returning()
      .execute();

    const testInput: SaveResultInput = {
      userId: userResult[0].id,
      calculatorId: calculatorResult[0].id,
      inputJson: { preciseInput: 123.456789 },
      resultValue: 9876.543210123, // High precision number
      unitLabel: 'kg'
    };

    const result = await saveResult(testInput);

    expect(result.resultValue).toBeCloseTo(9876.543210123, 4);
    expect(typeof result.resultValue).toBe('number');
  });

  it('should save multiple results for the same user and calculator', async () => {
    // Create prerequisite user and calculator
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
      .returning()
      .execute();

    const calculatorResult = await db.insert(calculatorsTable)
      .values({
        name: 'Harvest Calculator',
        slug: 'harvest-estimation',
        description: 'Calculate harvest estimation',
        category: 'farming',
        unitLabel: 'tons',
        formulaKey: 'harvest_estimation'
      })
      .returning()
      .execute();

    // Save first result
    const firstInput: SaveResultInput = {
      userId: userResult[0].id,
      calculatorId: calculatorResult[0].id,
      inputJson: { areaHa: 5, yieldTonPerHa: 3 },
      resultValue: 15,
      unitLabel: 'tons'
    };

    const firstResult = await saveResult(firstInput);

    // Save second result
    const secondInput: SaveResultInput = {
      userId: userResult[0].id,
      calculatorId: calculatorResult[0].id,
      inputJson: { areaHa: 10, yieldTonPerHa: 4 },
      resultValue: 40,
      unitLabel: 'tons'
    };

    const secondResult = await saveResult(secondInput);

    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.resultValue).toEqual(15);
    expect(secondResult.resultValue).toEqual(40);

    // Verify both results exist in database
    const allResults = await db.select()
      .from(resultsTable)
      .where(eq(resultsTable.userId, userResult[0].id))
      .execute();

    expect(allResults).toHaveLength(2);
  });
});