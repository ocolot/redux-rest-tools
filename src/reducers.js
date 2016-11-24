// @flow
import { handleActions } from 'redux-actions'
import { fromJS, Map, Iterable } from 'immutable'

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

type RestReducerConfigType = {
  idAttribute: string,
  actions: {},
  extraHandlers: {},
}

type RequestActionsType = {
  request: Function,
  success: Function,
  fail: Function,
}

type ActionType = {
  type: string,
  payload: {},
  meta: ?{
    onSuccess: ?() => {},
    onSuccessAction: ?any,
    onFail: ?() => {},
    onFailAction: ?any,
  },
}

export function getIdFromPayloadKey(action: ActionType, idAttribute: string) {
  const { payload } = action
  if (!payload) { throw new Error(`Action ${action.type} should include payload key`) }

  const id = payload[idAttribute]
  if (!id) { throw new Error(`Payload of action ${action.type} should include idAttribute key`) }
  return id
}

export function getIdFromNormalizedPayload(action: ActionType) {
  const { payload } = action
  if (!payload) { throw new Error(`Action ${action.type} should include payload key`) }

  const id = payload.result && payload.result[0]
  if (!id) { throw new Error(`Payload of action ${action.type} should include result array (entities idAttributes)`) }

  return id
}

export function getEntityFromAction(action: ActionType) {
  const id = getIdFromNormalizedPayload(action)

  const entity = action.payload.entities && action.payload.entities[id]
  if (!entity) { throw new Error(`Payload of action ${action.type} shoud include key ${id} in entities`)}

  return entity
}

function makeImmutable(obj: any) {
  return Iterable.isIterable(obj) ? obj : fromJS(obj)
}

const verbHandlers = {
  find(requestTypes, idAttribute) {
    return {
      [requestTypes.request]: (state) =>
        state.setIn(['ui', 'finding'], true),
      [requestTypes.success]: (state, { payload: { entities, result } }) =>
        state
          .set('entities', makeImmutable(entities))
          .set('result', makeImmutable(result))
          .setIn(['ui', 'finding'], false),
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
        const entity = getEntityFromAction(action)
        const id = getIdFromNormalizedPayload(action)
        return state
          .setIn(['entities', id], makeImmutable(entity))
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
    // NOTE: add entity to entities
    return {
      [requestTypes.request]: (state) =>
        state
          .setIn(['ui', 'creating'], true),
      [requestTypes.success]: (state, action) => {
        const entity = getEntityFromAction(action)
        const id = getIdFromNormalizedPayload(action)
        return state
          .setIn(['entities', id], makeImmutable(entity))
          .update('result', list => list.push(id))
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
        const entity = getEntityFromAction(action)
        const id = getIdFromNormalizedPayload(action)
        return state
          .setIn(['entities', id], makeImmutable(entity))
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
        const id = getIdFromNormalizedPayload(action)
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

export function handlerCreator(verb: string, requestActions: RequestActionsType, idAttribute: string) {
  const handler = verbHandlers[verb]

  if (!handler) { throw new Error(`${verb} handler not found`) }

  const suffixes = ['request', 'success', 'fail']

  for (const suffix of suffixes) {
    if (!requestActions[suffix]) {
      throw new Error(`${suffix} actions is required for ${verb} verb`)
    }
  }
  const requestTypes = {
    request: requestActions.request().type,
    success: requestActions.success().type,
    fail: requestActions.fail().type,
  }
  return handler(requestTypes, idAttribute)
}

export function restReducer(config: RestReducerConfigType) {
  const { actions, idAttribute, extraHandlers } = config
  if (!actions) { throw new Error('actions is required in restReducer config') }

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

  if (actions.clear) {
    const { type } = actions.clear()
    handlers[type] = () => initialState
  }

  if (actions.clearErrors) {
    const { type } = actions.clearErrors()
    handlers[type] = state => state.delete('errors')
  }

  return handleActions(handlers, initialState)
}
