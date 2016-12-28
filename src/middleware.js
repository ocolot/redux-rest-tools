// @flow
import { Iterable, fromJS } from 'immutable'

import normalize from './normalize'
import api from './api'
import { restVerbs } from './reducers'
import { requestSuffixes } from './shared'

type RequestOptionsType = {
  actions: RequestActionsType,
  idPath: IdPathType,
  apiConfig: RequestConfigType,
  immutable: ?boolean,
}

export function request(dispatch: Dispatch, action: ActionType, options: RequestOptionsType) {
  if (options.immutable === undefined) { options.immutable = true }
  const { actions, immutable, idPath, apiConfig } = options
  const { meta } = action

  api(apiConfig, action)
  .then(data =>
    // normalize if array
    Array.isArray(data) ? normalize(data, idPath) : data
  )
  .then(data => {
    // ensure data immutable or not
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
  })
  .then(data => {
    dispatch(actions.success(data))

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
  })
  .catch(error => {
    dispatch(actions.fail(error))
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
  })
}

export function computeIdPathString(idPath: IdPathType) {
  if (typeof idPath === 'string') {
    return idPath
  } else if (typeof idPath === 'function') {
    return idPath()
  } else if (Array.isArray(idPath)) {
    return idPath.join('.')
  }
  throw new Error('idPath should be a string, an array of string or a function')
}

export function computeApiConfig(baseRoute: string, verb: string, idPath: IdPathType) {
  const idPathString = computeIdPathString(idPath)

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
  actions: RequestActionsType,
  idPath: IdPathType, // NOTE: function call without parameters should return string (e.g. 'slug')
  baseRoute: string,
  immutable?: boolean,
}

export function middleware(options: RestOptionsType) {
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

    handlers[requestType] = (dispatch, action) =>
      request(dispatch, action, requestConfig)
  }

  return store => next => action => {
    const handler = handlers[action.type]
    if (handler) {
      handler(store.dispatch, action)
    }
    next(action)
  }
}
