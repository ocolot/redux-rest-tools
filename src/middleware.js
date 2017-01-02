// @flow
import { Iterable, fromJS } from 'immutable'
import throttle from 'lodash/throttle'

import normalize from './normalize'
import api from './api'
import { restVerbs } from './reducers'
import { requestSuffixes } from './shared'

type RequestOptionsType = {
  actions: RequestActions,
  idPath: IdPath,
  apiConfig: RequestConfigType,
  immutable?: boolean,
}

function handleSuccess(action: ActionType, data: any, dispatch: Dispatch<any>) {
  const { meta } = action
  if (meta) {
    const { onSuccess, onSuccessAction } = meta
    if (onSuccessAction) {
      const successAction = typeof onSuccessAction === 'function' ?
        onSuccessAction(data) :
        onSuccessAction
      dispatch(successAction)
    }
    if (onSuccess) {
      onSuccess(data)
    }
  }
}

function handleFail(action: ActionType, error: Error, dispatch: Dispatch<any>) {
  const { meta } = action
  if (!meta || !meta.onFail && !meta.onFailAction) {
    console.error(`Unhandled request error for action ${action.type}`)
    throw error
  }
  if (meta) {
    const { onFailAction, onFail } = meta
    if (onFailAction) {
      const failAction = typeof onFailAction === 'function' ?
        onFailAction(error) :
        onFailAction
      dispatch(failAction)
    }
    if (onFail) {
      onFail(error)
    }
  }
}

function ensureImmutability(data: any, immutable: boolean) {
  if (immutable) {
    if (!Iterable.isIterable(data)) {
      return fromJS(data)
    }
  } else {
    if (Iterable.isIterable(data)) {
      return data.toJS()
    }
  }
  return data
}

function normalizeIfArray(data: any, idPath: IdPath) {
  return Array.isArray(data) ? normalize(data, idPath) : data
}

export function callApi(dispatch: Dispatch<any>, action: ActionType, options: RequestOptionsType) {
  if (options.immutable === undefined) { options.immutable = true }
  const { actions, immutable, idPath, apiConfig } = options

  api(apiConfig, action)
  .then(data => normalizeIfArray(data, idPath))
  .then(data => ensureImmutability(data, immutable))
  .then(data => {
    dispatch(actions.success(data))
    handleSuccess(action, data, dispatch)
  })
  .catch(error => {
    dispatch(actions.fail(error))
    handleFail(action, error, dispatch)
  })
}

export function computeIdPathString(idPath: IdPath) {
  if (typeof idPath === 'string') {
    return idPath
  } else if (typeof idPath === 'function') {
    return idPath()
  } else if (Array.isArray(idPath)) {
    return idPath.join('.')
  }
}

export function computeApiConfig(baseRoute: string, verb: string, idPath: IdPath) {
  const idPathString = computeIdPathString(idPath)
  if (!idPathString) {
    throw new Error('idPath should be a string, an array of string or a function')
  }

  let method = 'get'
  let route = baseRoute
  switch (verb) {
    case 'findOne':
      route += `/:${idPathString}`
      break
    case 'create':
      method = 'post'
      break
    case 'update':
      method = 'put'
      route += `/:${idPathString}`
      break
    case 'delete':
      method = 'delete'
      route += `/:${idPathString}`
      break
  }

  return { method, route }
}

type RestOptionsType = {
  actions: RequestActions,
  idPath: IdPath, // NOTE: function call without parameters should return string (e.g. 'slug')
  baseRoute: string,
  immutable?: boolean,
  throttleFind?: number,
}

/**
 * Creates a middleware to handle REST requests.
 * @param  {object} options - The configuration object `{ actions: RequestActions, idPath: IdPath, baseRoute: string, immutable?: boolean}`. `actions`: and object where each key is a REST verb containing REST actions (request, succes and fail action creators) or contains REST reducer action creators. `IdPath`: the path to the REST entities identifiers (string, string array of function). `baseRoute`: the base route of the REST api (e.g. `/api/users`). `immutable`: use immutable objects as actions payload (`true` by default). `throttleFind`: wait duration (ms) to throttle find requests. E.g. with `idPath='slug'` and `baseRoute='/users'`, a call to `/users/:slug` will be made to handle the `findOne` verb.
 * @return {Middleware} - The REST middleware to add to your store.
 */
export function middleware(options: RestOptionsType): Middleware<any, any> {
  const errorContext = 'in REST middleware configuration'
  for (const key of ['actions', 'idPath', 'baseRoute']) {
    if (!options[key]) {
      throw new Error(`${key} required ${errorContext}`)
    }
  }
  const { actions, idPath, baseRoute, immutable } = options

  const verbs = Object.keys(actions)

  const handlers = {}
  for (const verb of verbs) {
    // only handle existing verbs in actions
    if (!restVerbs.includes(verb)) {
      continue
    }

    const requestActions = actions[verb]

    // validate request actions
    if (!requestActions) { throw new Error(`Request actions are required for each verb ${errorContext}`) }
    for (const suffix of requestSuffixes) {
      if (!requestActions[suffix]) {
        throw new Error(`${suffix} action missing for verb ${verb} ${errorContext}`)
      }
    }

    const { type: requestType } = requestActions.request()

    const requestConfig = {
      actions: requestActions,
      apiConfig: computeApiConfig(baseRoute, verb, idPath),
      idPath,
      immutable,
    }

    handlers[requestType] = (dispatch, action) => {
      if (verb === 'find' && options.throttleFind) {
        return throttle(callApi, options.throttleFind)(dispatch, action, requestConfig)
      }
      return callApi(dispatch, action, requestConfig)
    }
  }

  return store => next => action => {
    const handler = handlers[action.type]
    if (handler) {
      handler(store.dispatch, action)
    }
    next(action)
  }
}
