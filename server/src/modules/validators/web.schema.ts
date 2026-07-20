import { z } from 'zod'

export const webSearchSchema = z.object({
    query: z.string().min(1).max(500),
    limit: z.number().int().min(1).max(20).default(5),
})

export const webFetch = z.object({
    url: z.string().url()
})