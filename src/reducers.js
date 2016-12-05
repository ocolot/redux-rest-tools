// @flow
import { handleActions } from 'redux-actions'
import { fromJS, Map, Iterable } from 'immutable'

import { requestSuffixes } from './shared'

export const initialState = fromJS({
  entities: {},
  result: [],
  ui: {
    finding: false,
    findingOne: {},
    creating: false,
    updating: {},
    deleting: {},
  },
})

export function getIdFromPayloadKey(action: ActionType, idAttribute: string) {
  const { payload } = action
  if (!payload) { throw new Error(`Action ${action.type} should include payload key`) }

  const id = payload[idAttribute]
  if (!id) { throw new Error(`Payload of action ${action.type} should include idAttribute key`) }
  return id
}

function ensureImmutable(obj: any) {
  return Iterable.isIterable(obj) ? obj : fromJS(obj)
}

export function getEntity({ type, payload }: ActionType) {
  if (!payload) { throw new Error(`${type} action should include payload`) }
  return ensureImmutable(payload)
}

export function getEntityId(entity: Map<string, any>, idAttribute: string, type: string) {
  const id = entity.get(idAttribute)
  if (!id) { throw new Error(`${type} payload should include idAttribute (${idAttribute})`) }
  return id
}

const verbHandlers = {
  find(requestTypes, idAttribute) {
    return {
      [requestTypes.request]: (state) =>
        state.setIn(['ui', 'finding'], true),
      [requestTypes.success]: (state, { type, payload }) => {
        if (!payload) { throw new Error(`${type} action should include payload`) }
        const isImmutable = Iterable.isIterable(payload)
        const entities = isImmutable ? payload.get('entities') : fromJS(payload.entities)
        if (!entities) { throw new Error(`${type} should include entities (map with idAttributes as keys)`) }
        const result = isImmutable ? payload.get('result') : fromJS(payload.result)
        if (!result) { throw new Error(`${type} should include result (idAttributes list)`) }
        return state
          .set('entities', entities)
          .set('result', result)
          .setIn(['ui', 'finding'], false)
      },
      [requestTypes.fail]: (state, { payload: error }) =>
        state
          .setIn(['errors', 'find'], error)
          .setIn(['ui', 'finding'], false),
    }
  },
  findOne(requestTypes, idAttribute) {
    // NOTE: add entity to entities
    return {
      [requestTypes.request]: (state, action) => {
        const id = getIdFromPayloadKey(action, idAttribute)
        return state.setIn(['ui', 'findingOne', id], true)
      },
      [requestTypes.success]: (state, action) => {
        const entity = getEntity(action)
        const id = getEntityId(entity, idAttribute, action.type)
        return state
          .setIn(['entities', id], entity)
          .update('result', list => {
            if (list.includes(id)) { return list }
            return list.push(id)
          })
          .deleteIn(['ui', 'findingOne', id])
      },
      [requestTypes.fail]: (state, { payload: error }) =>
        state
          .setIn(['errors', 'findOne'], error)
          .setIn(['ui', 'findingOne'], Map()),
    }
  },
  create(requestTypes, idAttribute) {
    return {
      [requestTypes.request]: (state) =>
        state
          .setIn(['ui', 'creating'], true),
      [requestTypes.success]: (state, action) => {
        const entity = getEntity(action)
        const id = getEntityId(entity, idAttribute, action.type)
        return state
          .setIn(['entities', id], entity)
          .update('result', list => list.push(id)) // NOTE: no unicity check
          .setIn(['ui', 'creating'], false)
      },
      [requestTypes.fail]: (state, { payload: error }) =>
        state
          .setIn(['errors', 'create'], error)
          .setIn(['ui', 'creating'], false),
    }
  },
  update(requestTypes, idAttribute) {
    // NOTE: idAttribute cannot change
    return {
      [requestTypes.request]: (state, action) => {
        const id = getIdFromPayloadKey(action, idAttribute)
        return state
          .setIn(['ui', 'updating', id], true)
      },
      [requestTypes.success]: (state, action) => {
        const entity = getEntity(action)
        const id = getEntityId(entity, idAttribute, action.type)
        return state
          .setIn(['entities', id], entity)
          .deleteIn(['ui', 'updating', id])
      },
      [requestTypes.fail]: (state, { payload: error }) =>
        state
          .setIn(['errors', 'update'], error)
          .setIn(['ui', 'updating'], Map()),
    }
  },
  delete(requestTypes, idAttribute) {
    return {
      [requestTypes.request]: (state, action) => {
        const id = getIdFromPayloadKey(action, idAttribute)
        return state
          .setIn(['ui', 'deleting', id], true)
      },
      [requestTypes.success]: (state, action) => {
        const entity = getEntity(action)
        const id = getEntityId(entity, idAttribute, action.type)
        return state
          .deleteIn(['entities', id])
          .update('result', list => list.filter(idAttr => (idAttr !== id)))
          .deleteIn(['ui', 'deleting', id])
      },
      [requestTypes.fail]: (state, { payload: error }) =>
        state
          .setIn(['errors', 'delete'], error)
          .setIn(['ui', 'deleting'], Map()),
    }
  },
}

export const restVerbs = Object.keys(verbHandlers)

export const reducerHandlers = {
  clear() { return initialState },
  clearErrors(state: Map<string, any>) { return state.delete('errors') }
}

export const reducerSuffixes = Object.keys(reducerHandlers)

export function handlerCreator(verb: string, requestActions: RequestActionsType, idAttribute: string) {
  const handler = verbHandlers[verb]

  if (!handler) { throw new Error(`${verb} handler not found`) }

  for (const suffix of requestSuffixes) {
    if (!requestActions[suffix]) {
      throw new Error(`${suffix} actions is required for ${verb} verb`)
    }
  }

  const requestTypes = requestSuffixes.reduce((acc, suffix) => {
    acc[suffix] = requestActions[suffix]().type
    return acc
  }, {})

  return handler(requestTypes, idAttribute)
}

type RestReducerConfigType = {
  idAttribute: string,
  actions: {
    find?: RequestActionsType,
    findOne?: RequestActionsType,
    create?: RequestActionsType,
    update?: RequestActionsType,
    delete?: RequestActionsType,
    clear?: () => ActionType,
    clearErrors?: () => ActionType,
  },
  extraHandlers?: {},
}

export function restReducer(config: RestReducerConfigType) {
  const { actions, idAttribute, extraHandlers } = config
  if (!actions) { throw new Error('actions is required in restReducer config') }

  // request handlers
  const handlers = Object.keys(verbHandlers).reduce((result, verb) => {
    const requestActions = actions[verb]
    if (requestActions) {
      const handler = handlerCreator(verb, requestActions, idAttribute)
      Object.assign(result, handler)
    }
    return result
  }, {})

  if (extraHandlers) {
    Object.assign(handlers, extraHandlers)
  }

  // reducer handlers
  for(const key of reducerSuffixes) {
    if (actions[key] && typeof actions[key] === 'function') {
      const { type } = actions[key]()
      handlers[type] = reducerHandlers[key]
    }
  }

  return handleActions(handlers, initialState)
}
