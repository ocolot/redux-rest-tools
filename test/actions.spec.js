// @flow
import expect from 'expect'

import {
  createType,
  createRequestType,
  createReducerType,
  createAction,
  createRequestActions,
  createReducerActions,
  createRestActions,
} from '../src/actions'

const payload = { pay: 'load'}
const meta = { meta: 'is it?' }

describe('actions', () => {
  it('should createType', () => {
    expect(createType('this', 'Is', 'a', 'TYPE')).toBe('THIS_IS_A_TYPE')
  })

  it('should createRequestType', () => {
    expect(createRequestType('cats', 'find', 'request')).toBe('CATS_FIND_REQUEST')
  })

  it('should createReducerType', () => {
    expect(createReducerType('cats', 'clear')).toBe('CATS_CLEAR')
  })

  it('should createAction', () => {
    const action = createAction('CATS_FIND')
    expect(typeof action).toBe('function')
    expect(action(payload, meta)).toEqual({
      type: 'CATS_FIND',
      payload,
      meta,
    })
  })

  it('should createRequestActions', () => {
    const actions = createRequestActions('cats', 'find')
    for (const key of ['request', 'success', 'fail']) {
      expect(typeof actions[key]).toBe('function')
      expect(actions[key](payload, meta)).toEqual({
        type: `CATS_FIND_${key.toUpperCase()}`,
        payload,
        meta,
      })
    }
  })

  it('should createReducerActions', () => {
    const actions = createReducerActions('cats')
    expect(actions.clear()).toEqual({
      type: 'CATS_CLEAR',
    })
    expect(actions.clearErrors()).toEqual({
      type: 'CATS_CLEARERRORS',
    })
  })

  it('should createRestActions', () => {
    const config = {
      collection: 'cats',
      verbs: ['find', 'create'],
    }

    const actions = createRestActions(config)

    for(const verb of config.verbs) {
      for(const key of ['request', 'success', 'fail']) {
        expect(typeof actions[verb][key]).toBe('function')
        expect(actions[verb][key](payload, meta)).toEqual({
          type: `CATS_${verb}_${key}`.toUpperCase(),
          payload,
          meta,
        })
      }
    }
  })

})
