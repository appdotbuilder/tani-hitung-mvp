import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, calculatorsTable, resultsTable } from '../db/schema';
import { type DeleteResultInput, type CreateUserInput, type CreateCalculatorInput, type SaveResultInput } from '../schema';
import { deleteResult } from '../handlers/delete_result';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

const testUser2: CreateUserInput = {
  name: 'Test User 2',
  email: 'test2@example.com',
  password: 'password456'
};

const testCalculator: CreateCalculatorInput = {
  name: 'Test Calculator',
  slug: 'test-calculator',
  description: 'A calculator for testing',
  category: 'farming',
  unitLabel: 'kg',
  formulaKey: 'test_formula'
};

describe('deleteResult', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a result that belongs to the user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test calculator
    const calculatorResult = await db.insert(calculatorsTable)
      .values({
        name: testCalculator.name,
        slug: testCalculator.slug,
        description: testCalculator.description,
        category: testCalculator.category,
        unitLabel: testCalculator.unitLabel,
        formulaKey: testCalculator.formulaKey
      })
      .returning()
      .execute();
    const calculatorId = calculatorResult[0].id;

    // Create test result
    const resultData = await db.insert(resultsTable)
      .values({
        userId: userId,
        calculatorId: calculatorId,
        inputJson: { area: 10 },
        resultValue: '1000.5000',
        unitLabel: 'kg'
      })
      .returning()
      .execute();
    const resultId = resultData[0].id;

    const input: DeleteResultInput = {
      userId: userId,
      resultId: resultId
    };

    // Delete the result
    const success = await deleteResult(input);

    expect(success).toBe(true);

    // Verify the result was deleted from the database
    const results = await db.select()
      .from(resultsTable)
      .where(eq(resultsTable.id, resultId))
      .execute();

    expect(results).toHaveLength(0);
  });

  it('should return false when result does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const input: DeleteResultInput = {
      userId: userId,
      resultId: 999999 // Non-existent result ID
    };

    const success = await deleteResult(input);

    expect(success).toBe(false);
  });

  it('should return false when result belongs to different user', async () => {
    // Create first test user
    const userResult1 = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password
      })
      .returning()
      .execute();
    const userId1 = userResult1[0].id;

    // Create second test user
    const userResult2 = await db.insert(usersTable)
      .values({
        name: testUser2.name,
        email: testUser2.email,
        password: testUser2.password
      })
      .returning()
      .execute();
    const userId2 = userResult2[0].id;

    // Create test calculator
    const calculatorResult = await db.insert(calculatorsTable)
      .values({
        name: testCalculator.name,
        slug: testCalculator.slug,
        description: testCalculator.description,
        category: testCalculator.category,
        unitLabel: testCalculator.unitLabel,
        formulaKey: testCalculator.formulaKey
      })
      .returning()
      .execute();
    const calculatorId = calculatorResult[0].id;

    // Create result belonging to user1
    const resultData = await db.insert(resultsTable)
      .values({
        userId: userId1,
        calculatorId: calculatorId,
        inputJson: { area: 10 },
        resultValue: '1000.5000',
        unitLabel: 'kg'
      })
      .returning()
      .execute();
    const resultId = resultData[0].id;

    // Try to delete using user2's ID
    const input: DeleteResultInput = {
      userId: userId2,
      resultId: resultId
    };

    const success = await deleteResult(input);

    expect(success).toBe(false);

    // Verify the result still exists in the database
    const results = await db.select()
      .from(resultsTable)
      .where(eq(resultsTable.id, resultId))
      .execute();

    expect(results).toHaveLength(1);
    expect(results[0].userId).toBe(userId1);
  });

  it('should handle null userId in result record', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test calculator
    const calculatorResult = await db.insert(calculatorsTable)
      .values({
        name: testCalculator.name,
        slug: testCalculator.slug,
        description: testCalculator.description,
        category: testCalculator.category,
        unitLabel: testCalculator.unitLabel,
        formulaKey: testCalculator.formulaKey
      })
      .returning()
      .execute();
    const calculatorId = calculatorResult[0].id;

    // Create result with null userId (guest calculation)
    const resultData = await db.insert(resultsTable)
      .values({
        userId: null, // Guest calculation
        calculatorId: calculatorId,
        inputJson: { area: 10 },
        resultValue: '1000.5000',
        unitLabel: 'kg'
      })
      .returning()
      .execute();
    const resultId = resultData[0].id;

    const input: DeleteResultInput = {
      userId: userId,
      resultId: resultId
    };

    // Should return false because userId doesn't match (null vs userId)
    const success = await deleteResult(input);

    expect(success).toBe(false);

    // Verify the result still exists
    const results = await db.select()
      .from(resultsTable)
      .where(eq(resultsTable.id, resultId))
      .execute();

    expect(results).toHaveLength(1);
    expect(results[0].userId).toBeNull();
  });

  it('should successfully delete multiple results for the same user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test calculator
    const calculatorResult = await db.insert(calculatorsTable)
      .values({
        name: testCalculator.name,
        slug: testCalculator.slug,
        description: testCalculator.description,
        category: testCalculator.category,
        unitLabel: testCalculator.unitLabel,
        formulaKey: testCalculator.formulaKey
      })
      .returning()
      .execute();
    const calculatorId = calculatorResult[0].id;

    // Create multiple results for the same user
    const result1Data = await db.insert(resultsTable)
      .values({
        userId: userId,
        calculatorId: calculatorId,
        inputJson: { area: 10 },
        resultValue: '1000.5000',
        unitLabel: 'kg'
      })
      .returning()
      .execute();
    const resultId1 = result1Data[0].id;

    const result2Data = await db.insert(resultsTable)
      .values({
        userId: userId,
        calculatorId: calculatorId,
        inputJson: { area: 20 },
        resultValue: '2000.7500',
        unitLabel: 'kg'
      })
      .returning()
      .execute();
    const resultId2 = result2Data[0].id;

    // Delete first result
    const success1 = await deleteResult({
      userId: userId,
      resultId: resultId1
    });

    expect(success1).toBe(true);

    // Delete second result
    const success2 = await deleteResult({
      userId: userId,
      resultId: resultId2
    });

    expect(success2).toBe(true);

    // Verify both results were deleted
    const remainingResults = await db.select()
      .from(resultsTable)
      .where(eq(resultsTable.userId, userId))
      .execute();

    expect(remainingResults).toHaveLength(0);
  });
});