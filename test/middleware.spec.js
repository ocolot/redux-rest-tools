// @flow
import expect from 'expect'
import { Iterable, fromJS } from 'immutable'
// import axios from 'axios'

import { computeIdPathString, computeApiConfig, callApi } from '../src/middleware'
import * as api from '../src/api'
import * as normalize from '../src/normalize'
// import { cats } from './dummies'

describe('middleware', () => {
  describe('computeIdPathString', () => {
    it('should return the string when string', () => {
      expect(computeIdPathString('the-path')).toBe('the-path')
    })

    it('should return dot-joined string when string array', () =>  {
      expect(computeIdPathString(['the', 'path'])).toBe('the.path')
    })

    it('should return the function return value wihtout parameters when function', () => {
      expect(computeIdPathString(() => 'the-path')).toBe('the-path')
    })

    it('should return undefined when object', () => {
      expect(computeIdPathString({})).toBe(undefined)
    })
  })

  describe('computeApiConfig', () => {
    const baseRoute = '/entities'
    const idPath = 'id'
    it('should return find config', () => {
      expect(computeApiConfig(baseRoute, 'find', idPath)).toEqual({
        method: 'get',
        route: '/entities',
      })
    })

    it('should return findOne config', () => {
      expect(computeApiConfig(baseRoute, 'findOne', idPath)).toEqual({
        method: 'get',
        route: '/entities/:id',
      })
    })

    it('should return create config', () => {
      expect(computeApiConfig(baseRoute, 'create', idPath)).toEqual({
        method: 'post',
        route: '/entities',
      })
    })

    it('should return update config', () => {
      expect(computeApiConfig(baseRoute, 'update', idPath)).toEqual({
        method: 'put',
        route: '/entities/:id',
      })
    })

    it('should return delete config', () => {
      expect(computeApiConfig(baseRoute, 'delete', idPath)).toEqual({
        method: 'delete',
        route: '/entities/:id',
      })
    })
  })

  describe('callApi', () => {
    describe('success (data is object, immutable is true)', () => {
      const dispatch = expect.createSpy()
      const action = {
        type: 'TEST',
        meta: {
          onSuccessAction: data => data,
          onSuccess: expect.createSpy(),
        },
      }
      const apiConfig = { call: 'test' }
      const idPath = 'id'
      const data = { test: 'data' }
      const options = {
        actions: {
          success: expect.createSpy().andCall(data => data),
          fail: expect.createSpy().andCall(data => data),
        },
        idPath,
        apiConfig,
      }
      const apiSpy = expect.spyOn(api, 'default').andReturn(Promise.resolve(data))
      const normalizeSpy = expect.spyOn(normalize, 'default')
      callApi(dispatch, action, options)

      it('should call api', () => {
        expect(apiSpy).toHaveBeenCalledWith(apiConfig, action)
      })
      it('should not call normalize', () => {
        expect(normalizeSpy).toNotHaveBeenCalled()
      })
      it('should dispatch success action', () => {
        expect(dispatch.calls[0].arguments[0].toJS()).toEqual(data)
      })
      it('should dispatch onSuccessAction', () => {
        expect(dispatch.calls[1].arguments[0].toJS()).toEqual(data)
      })
      it('should call onSuccess function', () => {
        expect(action.meta.onSuccess).toHaveBeenCalledWith(fromJS(data))
      })
      expect.restoreSpies()
    })

    describe('success (data is array, immutable is true)', () => {
      const dispatch = expect.createSpy()
      const action = {
        type: 'TEST',
        meta: {
          onSuccessAction: data => data,
          onSuccess: expect.createSpy(),
        },
      }
      const apiConfig = { call: 'test' }
      const idPath = 'id'
      const data = [{ id: 1, test: 'data1' }, { id: 2, test: 'data2' }]
      const normalizedData = {
        entities: {
          1: { id: 1, test: 'data1' },
          2: { id: 2, test: 'data2' },
        },
        result: [1, 2],
      }
      const options = {
        actions: {
          success: expect.createSpy().andCall(data => data),
          fail: expect.createSpy().andCall(data => data),
        },
        idPath,
        apiConfig,
      }
      const apiSpy = expect.spyOn(api, 'default').andReturn(Promise.resolve(data))
      const normalizeSpy = expect.spyOn(normalize, 'default')
      callApi(dispatch, action, options)

      it('should call api', () => {
        expect(apiSpy).toHaveBeenCalledWith(apiConfig, action)
      })
      // TODO: decouple test with normalize
      // it('should normalize data', () => {
      //   NOTE: normalize is called, not the spy
      //   expect(normalizeSpy).toHaveBeenCalledWith(data, idPath)
      // })
      it('should dispatch success action', () => {
        expect(dispatch.calls[0].arguments[0].toJS()).toEqual(normalizedData)
      })
      it('should dispatch onSuccessAction', () => {
        expect(dispatch.calls[1].arguments[0].toJS()).toEqual(normalizedData)
      })
      it('should call onSuccess function', () => {
        expect(action.meta.onSuccess.getLastCall().arguments[0].toJS()).toEqual(normalizedData)
      })
      expect.restoreSpies()
    })

    it('fail (data is entity, immutable is true)')
    it('fail (data is array, immutable is true)')

    it('success (data is entity, immutable is false)')
    it('success (data is array, immutable is false)')
    it('fail (data is entity, immutable is false)')
    it('fail (data is array, immutable is false)')
  })
})
