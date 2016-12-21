import expect from 'expect'
import axios from 'axios'

import api, { replaceRouteParams } from '../src/api'
import { black, cats } from './dummies'

describe('api', () => {
  describe('replaceRouteParams', () => {
    it('should replace params in route', () => {
      const action = {
        type: 'TEST',
        payload: { id: 42 },
      }
      expect(replaceRouteParams('/entities/:id', action)).toBe('/entities/42')
    })

    it('should replace nested params in route', () => {
      const action = {
        type: 'TEST',
        payload: { deep: { id: 42 } },
      }
      expect(replaceRouteParams('/entities/:deep.id', action)).toBe('/entities/42')
    })
  })

  describe('request', () => {
    it('should get data (response contains object)', done => {
      const action = {
        type: 'TEST_REQUEST',
        payload: { id: 42 },
      }
      const requestConfig = { method: 'get', route: '/tests/:id' }
      const response = { data: black }
      const spy = expect
      .spyOn(axios, 'request')
      .andReturn(Promise.resolve(response))

      api(requestConfig, action).then(data => {
        expect(spy).toHaveBeenCalledWith({ method: 'get', url: '/tests/42', params: { id: 42 } })
        expect(data).toEqual(black, 'should resolve promise with data')
        spy.restore()
        done()
      })
    })

    it('should get data (response contains array of objects)', done => {
      const action = {
        type: 'TESTS_REQUEST',
        payload: {},
      }
      const requestConfig = { method: 'get', route: '/tests' }
      const response = { data: cats }
      const spy = expect
      .spyOn(axios, 'request')
      .andReturn(Promise.resolve(response))

      api(requestConfig, action).then(data => {
        expect(spy).toHaveBeenCalledWith({ method: 'get', url: '/tests', params: {} })
        expect(data).toEqual(cats, 'should resolve promise with data')
        spy.restore()
        done()
      })
    })
  })
})
