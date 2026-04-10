import type { Category } from '@/types'

export interface CategoryMeta {
  value: Category
  label: string
  color: string
  bg: string
}

export const CATEGORIES: CategoryMeta[] = [
  { value: 'teknoloji', label: 'Teknoloji', color: '#63b3ed', bg: 'rgba(99,179,237,.1)' },
  { value: 'sanat',     label: 'Sanat',     color: '#b794f4', bg: 'rgba(183,148,244,.1)' },
  { value: 'iş',        label: 'İş',        color: '#f6ad55', bg: 'rgba(246,173,85,.1)' },
  { value: 'sosyal',    label: 'Sosyal',    color: '#68d391', bg: 'rgba(104,211,145,.1)' },
  { value: 'eğitim',   label: 'Eğitim',   color: '#76e4f7', bg: 'rgba(118,228,247,.1)' },
  { value: 'sağlık',   label: 'Sağlık',   color: '#fc8181', bg: 'rgba(252,129,129,.1)' },
  { value: 'eğlence',  label: 'Eğlence',  color: '#f687b3', bg: 'rgba(246,135,179,.1)' },
  { value: 'diğer',    label: 'Diğer',    color: '#a0aec0', bg: 'rgba(160,174,192,.1)' },
]

export const CATEGORY_VALUES = CATEGORIES.map(c => c.value)

export function getCategoryMeta(value: Category): CategoryMeta {
  return CATEGORIES.find(c => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1]
}
