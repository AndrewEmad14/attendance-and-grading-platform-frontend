import { z } from 'zod'

const userFormBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Name is required' }),
  email: z
    .string()
    .trim()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Email address is invalid' }),
  role: z.string().min(1, { message: 'Role selection is required' }),
  expires_at: z.string().nullable().optional(),
  compensation_type: z.string().optional(),
  fixed_salary: z.union([z.number(), z.string(), z.undefined(), z.null()]).optional(),
  hourly_rate: z.union([z.number(), z.string(), z.undefined(), z.null()]),
  cohort_id: z.union([z.number(), z.string(), z.undefined(), z.null()]).optional(),
  lab_group_id: z.union([z.number(), z.string(), z.undefined(), z.null()]).optional(),
})

type UserFormBase = z.infer<typeof userFormBaseSchema>

export const userFormSchema = userFormBaseSchema
  .refine(
    (data: UserFormBase) => {
      if (data.role === 'student') {
        return !!data.cohort_id
      }
      return true
    },
    {
      message: 'Cohort assignment is required',
      path: ['cohort_id'],
    }
  )
  .refine(
    (data: UserFormBase) => {
      if (data.role !== 'student') {
        return !!data.compensation_type
      }
      return true
    },
    {
      message: 'Compensation type is required',
      path: ['compensation_type'],
    }
  )
  .refine(
    (data: UserFormBase) => {
      if (data.role !== 'student') {
        const salary = data.fixed_salary
        if (salary !== undefined && salary !== null && salary !== '') {
          return Number(salary) >= 0
        }
      }
      return true
    },
    {
      message: 'Monthly salary cannot be negative',
      path: ['fixed_salary'],
    }
  )
  .refine(
    (data: UserFormBase) => {
      if (data.role !== 'student') {
        const rate = data.hourly_rate
        if (rate === undefined || rate === null || rate === '') {
          return false
        }
        return Number(rate) >= 0
      }
      return true
    },
    {
      message: 'Hourly rate is required and cannot be negative',
      path: ['hourly_rate'],
    }
  )

export type UserFormInput = z.infer<typeof userFormSchema>