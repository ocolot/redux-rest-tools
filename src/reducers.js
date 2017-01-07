// @flow
import { handleActions } from 'redux-actions'
import { fromJS, Map, Iterable } from 'immutable'

import { requestSuffixes } from './shared'
import { get } from './helpers'

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

export function getIdFromPayloadKey(action: ActionType, idPath: IdPath) {
  const { payload } = action
  if (!payload) { throw new Error(`Action ${action.type} should include payload key`) }

  const id = get(payload, idPath)
  if (!id) { throw new Error(`Payload of action ${action.type} should include idPath key`) }

  return id
}

function ensureImmutable(obj: any) {
  return Iterable.isIterable(obj) ? obj : fromJS(obj)
}

export function getEntity({ type, payload }: ActionType) {
  if (!payload) { throw new Error(`${type} action should include payload`) }
  return ensureImmutable(payload)
}

export function getEntityId(entity: Map<string, any>, idPath: IdPath, type: string) {
  const id = get(entity, idPath)
  if (!id) { throw new Error(`${type} payload should include idPath`) }
  return id
}

const verbHandlers = {
  find(requestTypes, idPath) {
    return {
      [requestTypes.request]: (state) =>
        state.setIn(['ui', 'finding'], true),
      [requestTypes.success]: (state, { type, payload }) => {
        if (!payload) { throw new Error(`${type} action should include payload`) }
        const isImmutable = Iterable.isIterable(payload)
        const entities = isImmutable ? payload.get('entities') : fromJS(payload.entities)
        if (!entities) { throw new Error(`${type} should include entities (map with idPaths as keys)`) }
        const result = isImmutable ? payload.get('result') : fromJS(payload.result)
        if (!result) { throw new Error(`${type} should include result (idPaths list)`) }
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
  findOne(requestTypes, idPath) {
    return {
      [requestTypes.request]: (state, action) => {
        const id = getIdFromPayloadKey(action, idPath)
        return state.setIn(['ui', 'findingOne', id], true)
      },
      [requestTypes.success]: (state, action) => {
        const entity = getEntity(action)
        const id = getEntityId(entity, idPath, action.type)
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
  create(requestTypes, idPath) {
    return {
      [requestTypes.request]: (state) =>
        state
          .setIn(['ui', 'creating'], true),
      [requestTypes.success]: (state, action) => {
        const entity = getEntity(action)
        const id = getEntityId(entity, idPath, action.type)
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
  update(requestTypes, idPath) {
    // NOTE: the entity key returned by idPath cannot change
    return {
      [requestTypes.request]: (state, action) => {
        const id = getIdFromPayloadKey(action, idPath)
        return state
          .setIn(['ui', 'updating', id], true)
      },
      [requestTypes.success]: (state, action) => {
        const entity = getEntity(action)
        const id = getEntityId(entity, idPath, action.type)
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
  delete(requestTypes, idPath) {
    return {
      [requestTypes.request]: (state, action) => {
        const id = getIdFromPayloadKey(action, idPath)
        return state
          .setIn(['ui', 'deleting', id], true)
      },
      [requestTypes.success]: (state, action) => {
        const entity = getEntity(action)
        const id = getEntityId(entity, idPath, action.type)
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

/**
 * Creates the handler function to handle the REST request actions (request, success and fail).
 * @param  {string} verb - The verb to handle (find, findOne, create, update or delete).
 * @param  {RequestActions} requestActions - An object containing the request, success and fail action creators to handle.
 * @param  {IdPath} idPath - The path to the value to identify the REST entities (string, string array, function or string with dot seperaing keys).
 * @return {object} - An object containing the functions to handle request, success and fail state change in the reducer.
 */
export function handlerCreator(verb: string, requestActions: RequestActions, idPath: IdPath) {
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

  return handler(requestTypes, idPath)
}

type RestReducerConfigType = {
  idPath: IdPath,
  actions: {
    find?: RequestActions,
    findOne?: RequestActions,
    create?: RequestActions,
    update?: RequestActions,
    delete?: RequestActions,
    clear?: () => ActionType,
    clearErrors?: () => ActionType,
  },
  extraHandlers?: {},
}

/**
 * Creates a REST reducer to handle the verbs of the REST action creators.
 * @param  {object} config - The REST reducer config with the following keys: `idPath`, the path to the identifier of the requested objects (string, string array, function or string with dot seperaing keys); `actions`: each key of the object is a verb (find, findOne, create, update or delete) and contains the related REST action creators (request, success and fail); `extraHandlers`: an object where each key is the action type to handle and each key contains a function to handle the state change for these actions.
 * @return {Reducer} - A reducer to handle REST request actions and the extra handlers actions.
 */
export function restReducer(config: RestReducerConfigType) {
  const { actions, idPath, extraHandlers } = config
  if (!actions) { throw new Error('actions is required in restReducer config') }

  // request handlers
  const handlers = Object.keys(verbHandlers).reduce((result, verb) => {
    const requestActions = actions[verb]
    if (requestActions) {
      const handler = handlerCreator(verb, requestActions, idPath)
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
