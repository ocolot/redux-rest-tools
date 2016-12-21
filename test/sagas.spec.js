import expect from 'expect'
import { fromJS, Iterable } from 'immutable'
import axios from 'axios'

import { fetch } from '../src/sagas'
import * as api from '../src/api'
import { cats } from './dummies'

const idPath = 'id'
const getDefaultOptions = () => ({
  actions: {
    request: () => {},
    success: () => {},
    fail: () => {},
  },
  idPath,
})

describe('fecth', () => {
  const options = getDefaultOptions()
  const action = {
    type: 'TESTS_REQUEST',
    payload: {},
  }
  const apiReponse = { data: cats }

  const gen = fetch(options, action)

  let current

  it('should call api'
  // , () => {
  //   const spy = expect.spyOn(api, 'default').andReturn(Promise.resolve({ data: cats }))
  //   current = gen.next()
  //   expect(current.value).toEqual(apiReponse)
  //   // spy.restore()
  //   current = gen.next()
  // }
  )
})
