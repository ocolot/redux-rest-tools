// @flow
import { takeLatest } from 'redux-saga'
import { put, call, fork } from 'redux-saga/effects'
import { camelizeKeys } from 'humps'

import normalize from './normalize'
import api from './api'

import type { RequestConfigType } from './api'

const restVerbs = ['find', 'findOne', 'create', 'update', 'delete']

type IdAttributeType = string|(entity: ?{}) => string

type WatchOptionsType = {
  actions: {
    request: () => {},
    success: () => {},
    fail: () => {},
  },
  idAttribute: IdAttributeType,
  schema: {},
  requestConfig: RequestConfigType,
  immutable: ?boolean,
  camelizeKeys: ?boolean,
}
export type ActionType = {
  type: string,
  payload: {},
  meta: ?{
    onSuccess: ?() => {},
    onSuccessAction: ?any,
    onFail: ?() => {},
    onFailAction: ?any,
  },
}

export function* fetch(options: WatchOptionsType, action: ActionType): any {
  const { actions, immutable, idAttribute, camelizeKeys, requestConfig } = options
  const { meta } = action
  try {
    let data = yield call(api, requestConfig, action)
    let normalized = normalize(data, idAttribute)
    if (camelizeKeys) {
      data = camelizeKeys(data)
    }
    if (!immutable) {
      normalized = normalized.toJS()
    }

    yield put(actions.success(normalized))

    if (meta) {
      const { onSuccess, onSuccessAction } = meta

      if (onSuccessAction) {
        const successAction = typeof onSuccessAction === 'function' ?
          onSuccessAction(data) :
          onSuccessAction
        yield put(successAction)
      }
      if (onSuccess) {
        onSuccess(data)
      }
    }
  } catch (error) {
    yield put(actions.fail(error))
    if (meta) {
      const { onFailAction, onFail } = meta
      if (onFailAction) {
        const failAction = typeof onFailAction === 'function' ?
          onFailAction(error) :
          onFailAction
        yield put(failAction)
      }
      if (onFail) {
        onFail(error)
      }
    }
  }
}

export function* watchRequest(options: WatchOptionsType): any {
  const { actions, idAttribute } = options
  if (!actions) { throw new Error('actions are required') }
  if (!actions.request || !actions.success || !actions.fail) {
    throw new Error('request, success and fail actions are required')
  }
  const { type } = actions.request()
  yield* takeLatest(type, fetch, options)
}

type RestOptionsType = {
  actions: ActionType,
  idAttribute: IdAttributeType, // NOTE: function call without parameters should return string (e.g. 'slug')
  baseRoute: string,
}

export function* watchRestRequests(restOptions: RestOptionsType): any {
  const { actions, idAttribute, baseRoute } = restOptions
  if (!idAttribute || !['string', 'function'].includes(typeof idAttribute)) {
    throw new Error('In watchRestRequests, idAttribute must be a string or a function')
  }

  const verbs = Object.keys(actions)
  const idAttributeString = typeof idAttribute === 'function' ? idAttribute() : idAttribute
  for (const verb of verbs) {
    if (!restVerbs.includes(verb)) {
      continue
    }
    let method = 'get'
    let route = baseRoute
    switch (verb) {
      case 'findOne':
        route += `/:${idAttributeString}`
        break
      case 'create':
        method = 'post'
        break
      case 'update':
        method = 'put'
        route += `/:${idAttributeString}`
        break
      case 'delete':
        method = 'delete'
        route += `/:${idAttributeString}`
        break
    }
    yield fork(watchRequest, {
      actions: actions[verb],
      requestConfig: { method, route },
      idAttribute,
    })
  }
}
