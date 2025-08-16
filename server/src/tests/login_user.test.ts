import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';

const testUserData = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

const testLoginInput: LoginInput = {
  email: 'test@example.com',
  password: 'password123'
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should login user with correct credentials', async () => {
    // Create test user with hashed password using Bun's password hashing
    const hashedPassword = await Bun.password.hash(testUserData.password);
    const insertResult = await db.insert(usersTable)
      .values({
        name: testUserData.name,
        email: testUserData.email,
        password: hashedPassword
      })
      .returning()
      .execute();

    const createdUser = insertResult[0];

    // Attempt login
    const result = await loginUser(testLoginInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.name).toEqual(testUserData.name);
    expect(result!.email).toEqual(testUserData.email);
    expect(result!.password).toEqual(hashedPassword);
    expect(result!.createdAt).toBeInstanceOf(Date);
    expect(result!.updatedAt).toBeInstanceOf(Date);
  });

  it('should return null for non-existent user', async () => {
    const nonExistentLoginInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'somepassword'
    };

    const result = await loginUser(nonExistentLoginInput);

    expect(result).toBeNull();
  });

  it('should return null for incorrect password', async () => {
    // Create test user with hashed password
    const hashedPassword = await Bun.password.hash(testUserData.password);
    await db.insert(usersTable)
      .values({
        name: testUserData.name,
        email: testUserData.email,
        password: hashedPassword
      })
      .execute();

    // Attempt login with wrong password
    const wrongPasswordInput: LoginInput = {
      email: testUserData.email,
      password: 'wrongpassword'
    };

    const result = await loginUser(wrongPasswordInput);

    expect(result).toBeNull();
  });

  it('should handle case-sensitive email matching', async () => {
    // Create test user
    const hashedPassword = await Bun.password.hash(testUserData.password);
    await db.insert(usersTable)
      .values({
        name: testUserData.name,
        email: testUserData.email.toLowerCase(),
        password: hashedPassword
      })
      .execute();

    // Try login with different case email
    const caseVariantInput: LoginInput = {
      email: testUserData.email.toUpperCase(),
      password: testUserData.password
    };

    const result = await loginUser(caseVariantInput);

    // Should return null since email matching is case-sensitive
    expect(result).toBeNull();
  });

  it('should authenticate multiple users correctly', async () => {
    const user1Data = {
      name: 'User One',
      email: 'user1@example.com',
      password: 'password1'
    };

    const user2Data = {
      name: 'User Two',
      email: 'user2@example.com',
      password: 'password2'
    };

    // Create multiple users
    const hashedPassword1 = await Bun.password.hash(user1Data.password);
    const hashedPassword2 = await Bun.password.hash(user2Data.password);

    await db.insert(usersTable)
      .values([
        {
          name: user1Data.name,
          email: user1Data.email,
          password: hashedPassword1
        },
        {
          name: user2Data.name,
          email: user2Data.email,
          password: hashedPassword2
        }
      ])
      .execute();

    // Login as user1
    const result1 = await loginUser({
      email: user1Data.email,
      password: user1Data.password
    });

    expect(result1).not.toBeNull();
    expect(result1!.name).toEqual(user1Data.name);
    expect(result1!.email).toEqual(user1Data.email);

    // Login as user2
    const result2 = await loginUser({
      email: user2Data.email,
      password: user2Data.password
    });

    expect(result2).not.toBeNull();
    expect(result2!.name).toEqual(user2Data.name);
    expect(result2!.email).toEqual(user2Data.email);

    // Verify they are different users
    expect(result1!.id).not.toEqual(result2!.id);
  });

  it('should handle empty password correctly', async () => {
    // Create test user
    const hashedPassword = await Bun.password.hash(testUserData.password);
    await db.insert(usersTable)
      .values({
        name: testUserData.name,
        email: testUserData.email,
        password: hashedPassword
      })
      .execute();

    // Try login with empty password (this should be caught by Zod validation in practice)
    const emptyPasswordInput: LoginInput = {
      email: testUserData.email,
      password: ''
    };

    const result = await loginUser(emptyPasswordInput);

    expect(result).toBeNull();
  });
});