import { z } from 'zod'


export const createAnnouncementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: 'The title is too short. It must be at least 3 characters long.' })
    .max(255, { message: 'The title cannot exceed 255 characters.' }),
  body: z
    .string()
    .trim()
    .min(10, { message: 'Please write a more detailed announcement. It must be at least 10 characters.' })
    .max(5000, { message: 'The announcement content is too long. The maximum allowed limit is 5000 characters.' }),
})

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>


export const updateAnnouncementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, { message: 'The updated title is too short. It must be at least 3 characters.' })
    .max(255, { message: 'The updated title cannot exceed 255 characters.' })
    .optional(),
  body: z
    .string()
    .trim()
    .min(10, { message: 'The updated content is too short. It must be at least 10 characters.' })
    .max(5000, { message: 'The updated content is too long. It cannot exceed 5000 characters.' })
    .optional(),
})

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>