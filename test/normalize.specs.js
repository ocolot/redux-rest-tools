import expect from 'expect'

import normalize from '../src/normalize'
import { black, normalizedBlack, cats, normalizedCats } from './dummies'

describe('normalize', () => {
  it('should normalize object (string idAttribute)', () => {
    expect(normalize(black, 'name').toJS()).toEqual(normalizedBlack)
  })

  it('should normalize array (string idAttribute)', () => {
    expect(normalize(cats, 'name').toJS()).toEqual(normalizedCats)
  })

  it('should normalize object (function idAttribute)', () => {
    expect(normalize(black, cat => cat.name).toJS()).toEqual(normalizedBlack)
  })

  it('should normalize array (function idAttribute)', () => {
    expect(normalize(cats, cat => cat.name).toJS()).toEqual(normalizedCats)
  })
})
