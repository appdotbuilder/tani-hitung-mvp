import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, calculatorsTable, resultsTable } from '../db/schema';
import { type GetUserHistoryInput } from '../schema';
import { getUserHistory } from '../handlers/get_user_history';

// Create test users
const testUser1 = {
  name: 'Test User 1',
  email: 'user1@test.com',
  password: 'password123'
};

const testUser2 = {
  name: 'Test User 2',
  email: 'user2@test.com',
  password: 'password123'
};

// Create test calculator
const testCalculator = {
  name: 'Fertilizer Calculator',
  slug: 'fertilizer-calculator',
  description: 'Calculate fertilizer requirements',
  category: 'farming' as const,
  unitLabel: 'kg',
  formulaKey: 'fertilizer'
};

describe('getUserHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return calculation history for a user', async () => {
    // Create users
    const users = await db.insert(usersTable)
      .values([testUser1, testUser2])
      .returning()
      .execute();

    const user1 = users[0];
    const user2 = users[1];

    // Create calculator
    const calculators = await db.insert(calculatorsTable)
      .values([testCalculator])
      .returning()
      .execute();

    const calculator = calculators[0];

    // Create calculation results for user1 (insert separately to ensure different timestamps)
    // First result (older)
    await db.insert(resultsTable)
      .values([{
        userId: user1.id,
        calculatorId: calculator.id,
        inputJson: { areaHa: 2.5, doseKgPerHa: 100 },
        resultValue: '250.0000', // Insert as string for numeric column
        unitLabel: 'kg'
      }])
      .execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    // Second result (newer)
    await db.insert(resultsTable)
      .values([{
        userId: user1.id,
        calculatorId: calculator.id,
        inputJson: { areaHa: 1.0, doseKgPerHa: 150 },
        resultValue: '150.0000', // Insert as string for numeric column
        unitLabel: 'kg'
      }])
      .execute();

    // Result for different user
    await db.insert(resultsTable)
      .values([{
        userId: user2.id, // Different user
        calculatorId: calculator.id,
        inputJson: { areaHa: 3.0, doseKgPerHa: 200 },
        resultValue: '600.0000', // Insert as string for numeric column
        unitLabel: 'kg'
      }])
      .execute();

    const input: GetUserHistoryInput = { userId: user1.id };
    const results = await getUserHistory(input);

    // Should return only user1's results
    expect(results).toHaveLength(2);
    
    // Verify first result (should be newest first due to ordering)
    expect(results[0].userId).toEqual(user1.id);
    expect(results[0].calculatorId).toEqual(calculator.id);
    expect(results[0].inputJson).toEqual({ areaHa: 1.0, doseKgPerHa: 150 }); // Most recent
    expect(results[0].resultValue).toEqual(150); // Should be converted to number
    expect(typeof results[0].resultValue).toEqual('number');
    expect(results[0].unitLabel).toEqual('kg');
    expect(results[0].createdAt).toBeInstanceOf(Date);
    expect(results[0].id).toBeDefined();

    // Verify second result
    expect(results[1].userId).toEqual(user1.id);
    expect(results[1].calculatorId).toEqual(calculator.id);
    expect(results[1].inputJson).toEqual({ areaHa: 2.5, doseKgPerHa: 100 }); // Older
    expect(results[1].resultValue).toEqual(250); // Should be converted to number
    expect(typeof results[1].resultValue).toEqual('number');
    expect(results[1].unitLabel).toEqual('kg');

    // Verify ordering (newest first)
    expect(results[0].createdAt >= results[1].createdAt).toBe(true);
  });

  it('should return empty array for user with no calculation history', async () => {
    // Create a user but no calculation results
    const users = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    const user = users[0];

    const input: GetUserHistoryInput = { userId: user.id };
    const results = await getUserHistory(input);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return empty array for non-existent user', async () => {
    const input: GetUserHistoryInput = { userId: 999 }; // Non-existent user ID
    const results = await getUserHistory(input);

    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle complex input JSON correctly', async () => {
    // Create user
    const users = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    const user = users[0];

    // Create calculator
    const calculators = await db.insert(calculatorsTable)
      .values([testCalculator])
      .returning()
      .execute();

    const calculator = calculators[0];

    // Create result with complex JSON input
    const complexInput = {
      weightKg: 45.5,
      doseMgPerKg: 2.5,
      concentrationMgPerMl: 50,
      animalType: 'cattle',
      notes: 'Special treatment protocol'
    };

    await db.insert(resultsTable)
      .values([{
        userId: user.id,
        calculatorId: calculator.id,
        inputJson: complexInput,
        resultValue: '2.2750', // Insert as string for numeric column
        unitLabel: 'ml'
      }])
      .execute();

    const input: GetUserHistoryInput = { userId: user.id };
    const results = await getUserHistory(input);

    expect(results).toHaveLength(1);
    expect(results[0].inputJson).toEqual(complexInput);
    expect(results[0].resultValue).toEqual(2.275); // Should be converted to number
    expect(results[0].unitLabel).toEqual('ml');
  });

  it('should handle decimal precision correctly', async () => {
    // Create user and calculator
    const users = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    const calculators = await db.insert(calculatorsTable)
      .values([testCalculator])
      .returning()
      .execute();

    const user = users[0];
    const calculator = calculators[0];

    // Test with high precision decimal
    await db.insert(resultsTable)
      .values([{
        userId: user.id,
        calculatorId: calculator.id,
        inputJson: { test: true },
        resultValue: '123.4567', // High precision value
        unitLabel: 'units'
      }])
      .execute();

    const input: GetUserHistoryInput = { userId: user.id };
    const results = await getUserHistory(input);

    expect(results).toHaveLength(1);
    expect(results[0].resultValue).toEqual(123.4567);
    expect(typeof results[0].resultValue).toEqual('number');
  });

  it('should order results by creation date descending', async () => {
    // Create user and calculator
    const users = await db.insert(usersTable)
      .values([testUser1])
      .returning()
      .execute();

    const calculators = await db.insert(calculatorsTable)
      .values([testCalculator])
      .returning()
      .execute();

    const user = users[0];
    const calculator = calculators[0];

    // Create multiple results with slight delays to ensure different timestamps
    const result1 = await db.insert(resultsTable)
      .values([{
        userId: user.id,
        calculatorId: calculator.id,
        inputJson: { order: 1 },
        resultValue: '100.0000',
        unitLabel: 'kg'
      }])
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const result2 = await db.insert(resultsTable)
      .values([{
        userId: user.id,
        calculatorId: calculator.id,
        inputJson: { order: 2 },
        resultValue: '200.0000',
        unitLabel: 'kg'
      }])
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const result3 = await db.insert(resultsTable)
      .values([{
        userId: user.id,
        calculatorId: calculator.id,
        inputJson: { order: 3 },
        resultValue: '300.0000',
        unitLabel: 'kg'
      }])
      .returning()
      .execute();

    const input: GetUserHistoryInput = { userId: user.id };
    const results = await getUserHistory(input);

    expect(results).toHaveLength(3);
    
    // Should be ordered by newest first (descending)
    expect(results[0].inputJson).toEqual({ order: 3 }); // Most recent
    expect(results[1].inputJson).toEqual({ order: 2 }); // Middle
    expect(results[2].inputJson).toEqual({ order: 1 }); // Oldest

    // Verify timestamps are in descending order
    expect(results[0].createdAt >= results[1].createdAt).toBe(true);
    expect(results[1].createdAt >= results[2].createdAt).toBe(true);
  });
});