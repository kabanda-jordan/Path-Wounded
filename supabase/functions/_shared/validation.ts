export type ValidationSchema = Record<string, ValidationRule>

interface ValidationRule {
  type: "string" | "number" | "email" | "enum" | "boolean" | "optional"
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  values?: string[]
  transform?: (val: unknown) => unknown
}

export function validate(data: Record<string, unknown>, schema: ValidationSchema): { valid: true; data: Record<string, unknown> } | { valid: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  const result: Record<string, unknown> = {}

  for (const [key, rule] of Object.entries(schema)) {
    let value = data[key]

    if (rule.type === "optional") {
      if (value === undefined || value === null || value === "") continue
      result[key] = value
      continue
    }

    if (value === undefined || value === null || value === "") {
      if (rule.required !== false) {
        errors[key] = `${key} is required`
      }
      continue
    }

    if (rule.type === "string" || rule.type === "email") {
      value = String(value).trim()
      if (rule.minLength && value.length < rule.minLength) {
        errors[key] = `${key} must be at least ${rule.minLength} characters`
        continue
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors[key] = `${key} must be at most ${rule.maxLength} characters`
        continue
      }
      if (rule.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[key] = `${key} must be a valid email`
        continue
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors[key] = `${key} format is invalid`
        continue
      }
    }

    if (rule.type === "number") {
      value = Number(value)
      if (isNaN(value)) {
        errors[key] = `${key} must be a number`
        continue
      }
      if (rule.min !== undefined && value < rule.min) {
        errors[key] = `${key} must be at least ${rule.min}`
        continue
      }
      if (rule.max !== undefined && value > rule.max) {
        errors[key] = `${key} must be at most ${rule.max}`
        continue
      }
    }

    if (rule.type === "enum" && rule.values) {
      if (!rule.values.includes(String(value))) {
        errors[key] = `${key} must be one of: ${rule.values.join(", ")}`
        continue
      }
    }

    result[key] = rule.transform ? rule.transform(value) : value
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, data: result }
}
