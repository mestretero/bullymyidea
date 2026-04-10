import { describe, it, expectTypeOf } from 'vitest'
import type { Idea, Feedback, Vote, Report } from './index'

describe('types', () => {
  it('Idea has required fields', () => {
    type Check = Idea extends { id: any } ? true : false
    type IdCheck = Idea extends { id: string } ? true : false
    type TitleCheck = Idea extends { title: any } ? true : false
    type CategoryCheck = Idea extends { category: any } ? true : false
    type StatusCheck = Idea extends { status: any } ? true : false

    // Type checks that should all be true
    const _idOk: IdCheck = true
    const _titleOk: TitleCheck = true
    const _categoryOk: CategoryCheck = true
    const _statusOk: StatusCheck = true
  })

  it('Feedback has three content fields', () => {
    type StrengthsCheck = Feedback extends { strengths: any } ? true : false
    type WeaknessesCheck = Feedback extends { weaknesses: any } ? true : false
    type SuggestionsCheck = Feedback extends { suggestions: any } ? true : false

    const _strengthsOk: StrengthsCheck = true
    const _weaknessesOk: WeaknessesCheck = true
    const _suggestionsOk: SuggestionsCheck = true
  })
})
