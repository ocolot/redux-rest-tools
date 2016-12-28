// @flow
import { createAction as createReduxAction } from 'redux-actions'

import { requestSuffixes, reducerSuffixes } from './shared'

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

/**
 * Creates a request, success and fail actions.
 * @param {string} collection - The name of the collection.
 * @param {string} verb - The verb defining the request type (find, findOne, create, update, delete).
 * @returns {RequestActions} - An object containing the request, success and fail actions.
 */
export const createRequestActions = (collection: string, verb: string) =>
  requestSuffixes.reduce((result, suffix) => {
    const type = createRequestType(collection, verb, suffix)
    result[suffix] = createAction(type)
    return result
  }, {})

/**
 * Creates actions specific to the reducer.
 */
export const createReducerActions = (collection: string) =>
  reducerSuffixes.reduce((result, suffix) => {
    const type = createReducerType(collection, suffix)
    result[suffix] = createAction(type)
    return result
  }, {})

type RestActionsConfig = {
  collection: string,
  verbs: [string],
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
