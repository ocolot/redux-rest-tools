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
 * Creates request, success and fail action creators to handle the REST request for that collection and verb.
 * @param {string} collection - The name of the collection.
 * @param {string} verb - The verb defining the request type (find, findOne, create, update, delete).
 * @returns {RequestActions} - An object containing the request, success and fail action creators.
 */
export const createRequestActions = (collection: string, verb: string): RequestActions =>
  requestSuffixes.reduce((result, suffix) => {
    const type = createRequestType(collection, verb, suffix)
    result[suffix] = createAction(type)
    return result
  }, {})


/**
 * Creates clear and clearErrors action creators to alter portion of the state relative to the collection.
 * @param  {string} collection - The name of the collection.
 * @return {object}            - And object containing the clear and clearErrors action creators.
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

/**
 * Creates REST action creators (request, success and fail) for each verb of that collection and to manage that portion of the state.
 * @param  {object} config - The configuration object, `{ collection: string, verbs: [string] }`, where the `collection` key is the name of the collection and the verbs is an array of verb (`find`, `findOne`, `create`, `update` or `delete`) for which the REST actions will be generated.
 * @return {object}        - An object containing the REST action creators corresponding to each verb and the reducer action creators.
 */
export function createRestActions(config: RestActionsConfig) {
  const { collection, verbs } = config
  const actions = {}

  for (const verb of verbs) {
    actions[verb] = createRequestActions(collection, verb)
  }

  Object.assign(actions, createReducerActions(collection))

  return actions
}
