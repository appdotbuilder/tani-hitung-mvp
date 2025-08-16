import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const loginUser = async (input: LoginInput): Promise<User | null> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      return null; // User not found
    }

    const user = users[0];

    // Verify password using Bun's password verification
    const isPasswordValid = await Bun.password.verify(input.password, user.password);
    
    if (!isPasswordValid) {
      return null; // Invalid password
    }

    // Return user data (password will be included but should be handled by calling code)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  } catch (error) {
    console.error('User login failed:', error);
    throw error;
  }
};