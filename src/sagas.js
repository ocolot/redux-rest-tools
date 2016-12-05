// @flow
import { takeLatest } from 'redux-saga'
import { put, call, fork } from 'redux-saga/effects'
import { camelizeKeys } from 'humps'
import { Iterable, fromJS } from 'immutable'

import normalize from './normalize'
import api from './api'
import { restVerbs } from './reducers'

type IdAttributeType = string|(entity: ?{}) => string

type WatchOptionsType = {
  actions: RequestActionsType,
  idAttribute: IdAttributeType,
  schema: {},
  requestConfig: RequestConfigType,
  immutable: ?boolean,
  camelizeKeys: ?boolean,
  isArray: boolean,
}

export function* fetch(options: WatchOptionsType, action: ActionType): any {
  if (options.immutable === undefined) { options.immutable = true }
  const { actions, immutable, idAttribute, requestConfig, isArray } = options
  const { meta } = action
  try {
    let data = yield call(api, requestConfig, action)

    if (options.camelizeKeys) {
      data = camelizeKeys(data)
    }

    if (Array.isArray(data)) {
      data = normalize(data, idAttribute)
    }

    if (!immutable && Iterable.isIterable(data)) {
      data = data.toJS()
    }

    yield put(actions.success(data))

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
  actions: RequestActionsType,
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
      isArray: verb === 'find',
    })
  }
}
