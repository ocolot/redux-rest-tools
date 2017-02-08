// @flow
import expect from 'expect'

import { reducerSuffixes, requestSuffixes, restVerbs } from '../src/shared'

describe('reducerSuffixes', () => {
  it('should include reducer suffixes', () => {
    expect(reducerSuffixes).toEqual(['clear', 'clearErrors'])
  })
})

describe('requestSuffixes', () => {
  it('should include request suffixes', () => {
    expect(requestSuffixes).toEqual(['request', 'success', 'fail'])
  })
})

describe('restVerbs', () => {
  it('should include rest verbs', () => {
    expect(restVerbs).toEqual(['find', 'findOne', 'create', 'update', 'delete'])
  })
})
