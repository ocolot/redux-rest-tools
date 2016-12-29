// @flow
import { Map, List, Iterable } from 'immutable'

import { initialState } from './reducers'

type GetEntitiesOptionsType = {
  reverse: ?bool,
  immutable: ?bool,
}

type ReducerSubStateType = ?Map<string,any>

const getEntitiesOptionsDefault = {
  reverse: false,
  immutable: true,
}

/**
 * Gets the entities from the state.
 * @param  {object} reducerSubState - the part of the state handled by the REST reducer.
 * @param  {object} options - the options may contain: `immutable` (boolean, defaults to true) to define if JS (requires a `toJS` conversion) or immutable objects (better for performance) should be returned; `reverse` (boolean, defaults to false) to return the objects in reverse order.
 * @return {oject} The entities from the state (immutable list or JS array depending on the configuration).
 */
export function getEntities(reducerSubState: ReducerSubStateType, options: GetEntitiesOptionsType = getEntitiesOptionsDefault) {
  options = { ...getEntitiesOptionsDefault, ...options }
  const { immutable } = options

  const empty = immutable ? List() : ([]: [any])
  if (!reducerSubState) { return empty }
  const entities = reducerSubState.get('entities')
  let result = reducerSubState.get('result')
  if (!entities || !result) { return empty }
  if (options.reverse) { result = result.reverse() }
  result = result.map(id => entities.get(id))
  return immutable ? result : result.toJS()
}

type GetEntityOptionsType = {
  immutable: ?bool,
}

const getEntityOptionsDefault = {
  immutable: true,
}

/**
 * Gets an entity from the state.
 * @param  {object} reducerSubState - the part of the state handled by the REST reducer.
 * @param  {string} key - the key of the entity to retrieve (the value returned by the specified `idPath`).
 * @param  {object} options - the options to use. `immutable`: boolean to specify if the returned object should be immutable (defaults to true).
 * @return {object} The entity (immutable map or JS array depending on the configuration).
 */
export function getEntity(reducerSubState: ReducerSubStateType, key: string, options: GetEntityOptionsType = getEntityOptionsDefault) {
  options = { ...getEntityOptionsDefault, ...options }
  if (!reducerSubState) { return }
  const entity = reducerSubState.getIn(['entities', key])
  return entity ? (options.immutable ? entity : entity.toJS()) : undefined
}

let statuses

/**
 * Gets the status of the request.
 * @param  {object} reducerSubState - the part of the state handled by the REST reducer.
 * @param  {string} status - one of `finding`, `findingOne`, `creating`, `updating` or `deleting`.
 * @param  {string} key (optional) - the key of the entity (the value returned by the specified `idPath`).
 * @return {boolean} `true` if the request is pending, else `false`.
 */
export function getStatus(reducerSubState: ReducerSubStateType, status: string, key: ?string) {
  if (!statuses) { statuses = initialState.get('ui').keySeq() }
  if (!reducerSubState) { return }
  if (!statuses.includes(status)) {
    const allowedStatus = statuses.join(', ')
    throw new Error(`In getStatus, status should be one of ${allowedStatus}`)
  }
  const path = ['ui', status]
  if (key) { path.push(key) }
  return reducerSubState.getIn(path)
}

export function get(obj: EntityType, path: IdPath) {
  if (!obj) { return }

  if (typeof path === 'string' || Array.isArray(path)) {
    const keys = typeof path === 'string' ? path.split('.') : path
    if (Iterable.isIterable(obj)) {
      if (!obj.hasIn(keys)) { throw new Error(`Path ${JSON.stringify(keys)} not found in ${JSON.stringify(obj.toJS())}`) }
      return obj.getIn(keys)
    } else {
      return keys.reduce((acc, key) => {
        if (!(key in acc)) { throw new Error(`Path ${JSON.stringify(keys)} not found in ${JSON.stringify(obj)}`) }
        return acc[key]
      }, obj)
    }
  }

  if (typeof path === 'function') {
    return path(obj)
  }
}
