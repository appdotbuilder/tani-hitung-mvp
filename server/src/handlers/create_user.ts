import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';

export async function createUser(input: CreateUserInput): Promise<User> {
  try {
    // Hash the password using Bun's built-in password hashing
    const hashedPassword = await Bun.password.hash(input.password, {
      algorithm: "bcrypt",
      cost: 12
    });

    // Insert user record
    const result = await db.insert(usersTable)
      .values({
        name: input.name,
        email: input.email,
        password: hashedPassword,
      })
      .returning()
      .execute();

    const user = result[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
}