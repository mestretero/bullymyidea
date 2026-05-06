import type { Category } from '@/types'

export interface CategoryMeta {
  value: Category
  label: string
  color: string
  bg: string
}

export const CATEGORIES: CategoryMeta[] = [
  { value: 'technology',    label: 'Technology',    color: '#63b3ed', bg: 'rgba(99,179,237,.1)' },
  { value: 'art',           label: 'Art',           color: '#b794f4', bg: 'rgba(183,148,244,.1)' },
  { value: 'business',      label: 'Business',      color: '#f6ad55', bg: 'rgba(246,173,85,.1)' },
  { value: 'social',        label: 'Social',        color: '#68d391', bg: 'rgba(104,211,145,.1)' },
  { value: 'education',     label: 'Education',     color: '#76e4f7', bg: 'rgba(118,228,247,.1)' },
  { value: 'health',        label: 'Health',        color: '#fc8181', bg: 'rgba(252,129,129,.1)' },
  { value: 'entertainment', label: 'Entertainment', color: '#f687b3', bg: 'rgba(246,135,179,.1)' },
  { value: 'other',         label: 'Other',         color: '#a0aec0', bg: 'rgba(160,174,192,.1)' },
]

export const CATEGORY_VALUES = CATEGORIES.map(c => c.value)

export function getCategoryMeta(value: Category): CategoryMeta {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1]
}
