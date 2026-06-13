import { z } from 'zod'


export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: 'Email is required.' })
    .email({ message: 'Email must be a valid email address.' })
    .max(255, { message: 'Email cannot exceed 255 characters.' }), // Prevents overflow exploitation
  
  password: z
    .string()
    .min(1, { message: 'Password is required.' })
    .max(64, { message: 'Password cannot exceed 64 characters.' }) // Aligns with max reset password limits
})

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: 'Email is required.' })
    .email({ message: 'Email must be a valid email address with a real domain.' })
    .max(255, { message: 'Email cannot exceed 255 characters.' })
})


const resetPasswordObject = z.object({
  token: z
    .string()
    .min(1, { message: 'Reset token is required.' }),
  
  email: z
    .string()
    .trim()
    .min(1, { message: 'Email is required.' })
    .email({ message: 'Email must be a valid email address with a real domain.' })
    .max(255, { message: 'Email cannot exceed 255 characters.' }),
  
  password: z
    .string()
    .min(1, { message: 'Password is required.' })
    .min(8, { message: 'Password must be at least 8 characters.' })
    .max(64, { message: 'Password cannot exceed 64 characters.' }),
  
  password_confirmation: z
    .string()
    .min(1, { message: 'Password confirmation is required.' })
})


export const resetPasswordSchema = resetPasswordObject.refine(
  // Explicitly assign the type using z.infer on the base object shape
  (data: z.infer<typeof resetPasswordObject>) => data.password === data.password_confirmation, 
  {
    message: 'Password confirmation does not match.',
    path: ['password_confirmation']
  }
)

// --- Inferred TypeScript Types ---
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>