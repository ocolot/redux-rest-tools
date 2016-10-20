// @flow
import { takeLatest } from 'redux-saga'
import { put, call, fork } from 'redux-saga/effects'
import axios from 'axios'
import { arrayOf, normalize } from 'normalizr'
import { camelizeKeys } from 'humps'
import { Schema } from 'normalizr'

const restVerbs = ['find', 'findOne', 'create', 'update', 'delete']

type RequestConfigType = { method: string, route: string, data: Object }
type WatchOptionsType = {
  actions: {
    request: 'function',
    success: 'function',
    fail: 'function',
  },
  schema: {},
  requestConfig: RequestConfigType,
}
type ActionType = {
  type: string,
  payload: {},
  meta: ?{
    onSuccess: ?() => {},
    onSuccessAction: ?any,
    onFail: ?() => {},
    onFailAction: ?any,
  },
}

function replaceUrlParams(route, action) {
  let url = route
  const urlParams = url.match(/:[a-zA-Z]+\b/g)

  if (urlParams) {
    for (const urlParam of urlParams) {
      const key = urlParam.substring(1)
      url = url.replace(urlParam, action.payload[key])
    }
  }
  return url
}

function* fetchApi(options: WatchOptionsType, action: ActionType) {
  const { schema, requestConfig: { route, ...config } } = options
  config.url = replaceUrlParams(route, action)

  if (!config.method) { throw new Error('method missing in watchRequest config') }
  if (['post', 'put', 'patch'].includes(config.method.toLowerCase())) {
    config.data = action.payload
  }

  let { data } = yield axios.request(config)

  if (action.camelizeKeys) {
    data = camelizeKeys(data)
  }

  const {
    result,
    entities: { entities },
  } = normalize(Array.isArray(data) ? data : [data], arrayOf(schema))

  return { normalized: { result, entities: entities || {} }, data }
}

function* fetch(options: WatchOptionsType, action: ActionType) {
  const { actions } = options
  const { meta } = action
  try {
    const { normalized, data } = yield call(fetchApi, options, action)
    yield put(actions.success(normalized))
    if (meta) {
      const { onSuccess, onSuccessAction } = meta
      if (onSuccess || onSuccessAction) {
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

export function* watchRequest(options: WatchOptionsType) {
  const { actions } = options
  if (!actions) { throw new Error('actions are required') }
  if (!actions.request || !actions.success || !actions.fail) {
    throw new Error('request, success and fail actions are required')
  }
  const { type } = actions.request()
  yield* takeLatest(type, fetch, options)
}

type RestOptionsType = {
  actions: ActionType,
  idAttribute: string,
  baseRoute: string,
}

export default function* watchRestRequests(restOptions: RestOptionsType) {
  const { actions, idAttribute, baseRoute } = restOptions
  const schema = new Schema('entities', { idAttribute })

  const verbs = Object.keys(actions)
  for (const verb of verbs) {
    if (!restVerbs.includes(verb)) {
      continue
    }
    let method = 'get'
    let route = baseRoute
    switch (verb) {
      case 'findOne':
        route += `/:${idAttribute}`
        break
      case 'create':
        method = 'post'
        break
      case 'update':
        method = 'put'
        route += `/:${idAttribute}`
        break
      case 'delete':
        method = 'delete'
        route += `/:${idAttribute}`
        break
    }
    yield fork(watchRequest, {
      actions: actions[verb],
      schema,
      requestConfig: { method, route },
    })
  }
}
