// @flow
import { createAction as createReduxAction } from 'redux-actions'

const requestSuffixes = ['request', 'success', 'fail']
const reducerSuffixes = ['clear', 'clearErrors']

export const createType = (...array: any) =>
  array.map(str => str.toUpperCase()).join('_')

export const createRequestType = (collection: string, verb: string, suffix: string) =>
  createType(collection, verb, suffix)

export const createReducerType = (collection: string, suffix: string) =>
  createType(collection, suffix)

export const createAction = (type: string) => (payload: any, meta: any) => {
  const metaCreator = meta ? () => meta : undefined
  return createReduxAction(type, p => p, metaCreator)(payload)
}

export const createRequestActions = (collection: string, verb: string) =>
  requestSuffixes.reduce((result, suffix) => {
    const type = createRequestType(collection, verb, suffix)
    result[suffix] = createAction(type)
    return result
  }, {})

export const createReducerActions = (collection: string) =>
  reducerSuffixes.reduce((result, suffix) => {
    const type = createReducerType(collection, suffix)
    result[suffix] = createAction(type)
    return result
  }, {})

export function createRestActions(config: RestActionsConfig) {
  const { collection, verbs } = config
  const actions = {}

  for (const verb of verbs) {
    actions[verb] = createRequestActions(collection, verb)
  }

  Object.assign(actions, createReducerActions(collection))

  return actions
}
