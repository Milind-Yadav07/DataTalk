'use server';

import { dbConnect } from '@/lib/db/mongoose';
import { UserModel } from '@/lib/db/models/User.model';
import * as bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function registerUser(data: z.infer<typeof registerSchema>) {
  try {
    const validated = registerSchema.safeParse(data);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0].message,
      };
    }

    const { name, email, password } = validated.data;

    await dbConnect();

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return {
        success: false,
        error: 'A user with this email already exists.',
      };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    await UserModel.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred during registration. Please try again.',
    };
  }
}
