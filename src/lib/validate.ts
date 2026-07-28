import { ZodSchema } from 'zod'

interface ValidationSuccess<T> {
  success: true
  data: T
  errors: undefined
}

interface ValidationFailure {
  success: false
  data: undefined
  errors: Record<string, string[]>
}

export function validate<T>(schema: ZodSchema<T, any, any>, data: unknown): ValidationSuccess<T> | ValidationFailure {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data, errors: undefined }
  }
  const errors: Record<string, string[]> = {}
  for (const issue of result.error.issues) {
    const key = issue.path.join('.')
    if (!errors[key]) errors[key] = []
    errors[key].push(issue.message)
  }
  return { success: false, data: undefined, errors }
}
