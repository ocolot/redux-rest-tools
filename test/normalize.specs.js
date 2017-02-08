// @flow
import expect from 'expect'

import normalize from '../src/normalize'
import { black, normalizedBlack, cats, normalizedCats } from './dummies'

describe('normalize', () => {
  it('should normalize object (string idPath)', () => {
    expect(normalize(black, 'name').toJS()).toEqual(normalizedBlack)
  })

  it('should normalize array (string idPath)', () => {
    expect(normalize(cats, 'name').toJS()).toEqual(normalizedCats)
  })

  it('should normalize object (function idPath)', () => {
    expect(normalize(black, cat => cat.name).toJS()).toEqual(normalizedBlack)
  })

  it('should normalize array (function idPath)', () => {
    expect(normalize(cats, cat => cat.name).toJS()).toEqual(normalizedCats)
  })
})
