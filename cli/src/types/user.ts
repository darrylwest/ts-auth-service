import { z } from 'zod';

export const UserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  name: z.string().min(1)
});

export type User = z.infer<typeof UserSchema>;

export const UsersDataSchema = z.record(z.string(), UserSchema);

export type UsersData = z.infer<typeof UsersDataSchema>;