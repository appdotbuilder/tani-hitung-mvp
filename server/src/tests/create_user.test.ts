import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'securePassword123'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with hashed password', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.id).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    
    // Password should be hashed (not the original)
    expect(result.password).not.toEqual('securePassword123');
    expect(result.password).toMatch(/^\$2[ayb]\$12\$/); // bcrypt hash pattern
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('John Doe');
    expect(users[0].email).toEqual('john.doe@example.com');
    expect(users[0].createdAt).toBeInstanceOf(Date);
    expect(users[0].updatedAt).toBeInstanceOf(Date);
    
    // Verify password is properly hashed
    expect(users[0].password).not.toEqual('securePassword123');
    expect(users[0].password).toMatch(/^\$2[ayb]\$12\$/);
  });

  it('should verify password can be validated against hash', async () => {
    const result = await createUser(testInput);

    // Verify the hashed password matches the original
    const isValid = await Bun.password.verify('securePassword123', result.password);
    expect(isValid).toBe(true);
    
    // Verify wrong password doesn't match
    const isInvalid = await Bun.password.verify('wrongPassword', result.password);
    expect(isInvalid).toBe(false);
  });

  it('should enforce email uniqueness', async () => {
    // Create first user
    await createUser(testInput);

    // Attempt to create second user with same email
    const duplicateInput: CreateUserInput = {
      name: 'Jane Smith',
      email: 'john.doe@example.com', // Same email
      password: 'differentPassword'
    };

    // Should throw error due to unique constraint
    await expect(createUser(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle different password lengths correctly', async () => {
    const shortPasswordInput: CreateUserInput = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'short1' // 6 characters (minimum)
    };

    const result = await createUser(shortPasswordInput);
    
    expect(result.name).toEqual('Test User');
    expect(result.password).toMatch(/^\$2[ayb]\$12\$/);
    
    // Verify password verification works
    const isValid = await Bun.password.verify('short1', result.password);
    expect(isValid).toBe(true);
  });

  it('should create multiple users with different emails', async () => {
    const user1Input: CreateUserInput = {
      name: 'User One',
      email: 'user1@example.com',
      password: 'password123'
    };

    const user2Input: CreateUserInput = {
      name: 'User Two',
      email: 'user2@example.com',
      password: 'password456'
    };

    const result1 = await createUser(user1Input);
    const result2 = await createUser(user2Input);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.email).toEqual('user1@example.com');
    expect(result2.email).toEqual('user2@example.com');
    expect(result1.password).not.toEqual(result2.password);

    // Verify both users exist in database
    const users = await db.select().from(usersTable).execute();
    expect(users).toHaveLength(2);
  });
});