// @flow
import { createAction as createReduxAction } from 'redux-actions'

const requestSuffixes = ['request', 'success', 'fail']
const reducerSuffixes = ['clear', 'clearErrors']

function createType(...array) {
  return array.map(str => str.toUpperCase()).join('_')
}

export function createRequestType(collection: string, verb: string, suffix: string) {
  return createType(collection, verb, suffix)
}

export function createReducerType(collection: string, suffix: string) {
  return createType(collection, suffix)
}

type RestActionsConfig = { collection: string, verbs: [string] }

function createAction(type) {
  return (payload, meta) => {
    const metaCreator = meta ? () => meta : undefined
    return createReduxAction(type, p => p, metaCreator)(payload)
  }
}

export function createRequestActions(collection: string, verb: string) {
  return requestSuffixes.reduce((result, suffix) => {
    const type = createRequestType(collection, verb, suffix)
    result[suffix] = createAction(type)
    return result
  }, {})
}

export function createReducerActions(collection: string) {
  return reducerSuffixes.reduce((result, suffix) => {
    const type = createReducerType(collection, suffix)
    result[suffix] = createAction(type)
    return result
  }, {})
}

export function createRestActions(config: RestActionsConfig) {
  const { collection, verbs } = config
  const actions = {}

  for (const verb of verbs) {
    actions[verb] = createRequestActions(collection, verb)
  }

  Object.assign(actions, createReducerActions(collection))

  return actions
}
