// @flow
import { Map, List } from 'immutable'

import { initialState } from './reducers'

type GetEntitiesOptionsType = {
  reverse: ?bool,
  immutable: ?bool,
}

const getEntitiesOptionsDefault = {
  reverse: false,
  immutable: true,
}

export function getEntities(reducerSubState: ?Map, options: GetEntitiesOptionsType = getEntitiesOptionsDefault) {
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

export function getEntity(reducerSubState: ?Map, idAttribute: string, options: GetEntityOptionsType = getEntityOptionsDefault) {
  options = { ...getEntityOptionsDefault, ...options }
  if (!reducerSubState) { return }
  const entity = reducerSubState.getIn(['entities', idAttribute])
  return entity ? (options.immutable ? entity : entity.toJS()) : undefined
}

const statuses = initialState.get('ui').keySeq()

export function getStatus(reducerSubState: ?Map, status: string, idAttribute: ?string) {
  if (!reducerSubState) { return }
  if (!statuses.includes(status)) {
    const allowedStatus = statuses.join(', ')
    throw new Error(`In getStatus, status should be one of ${allowedStatus}`)
  }
  const path = ['ui', status]
  if (idAttribute) { path.push(idAttribute) }
  return reducerSubState.getIn(path)
}
