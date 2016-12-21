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

export function getEntity(reducerSubState: ReducerSubStateType, key: string, options: GetEntityOptionsType = getEntityOptionsDefault) {
  options = { ...getEntityOptionsDefault, ...options }
  if (!reducerSubState) { return }
  const entity = reducerSubState.getIn(['entities', key])
  return entity ? (options.immutable ? entity : entity.toJS()) : undefined
}

let statuses
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

export function get(obj: EntityType, path: IdPathType) {
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
