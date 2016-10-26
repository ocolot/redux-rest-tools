// @flow
import { handleActions } from 'redux-actions'
import { fromJS, Map } from 'immutable'

const initialState = fromJS({
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


export function getIdFromPayload(action, idAttribute) {
  const id = action.payload && action.payload[idAttribute]
  if (!id) { throw new Error(`Payload of action ${action.type} should include ${idAttribute} key`) }
  return id
}

export function getEntityFromAction(action, idAttribute) {
  const { payload } = action
  if (!payload) { throw new Error(`Action ${action.type} should include payload key`) }

  const id = payload.result && payload.result[0]
  if (!id) { throw new Error(`Payload of action ${action.type} should include result key (array of \'${idAttribute}\' attributes)`) }

  const entity = payload.entities && payload.entities[id]
  if (!entity) { throw new Error(`Payload of action ${action.type} shoud include key ${id} in entities`)}

  return entity
}

const verbHandlers = {
  find(requestTypes, idAttribute) {
    return {
      [requestTypes.request]: (state) =>
        state.setIn(['ui', 'finding'], true),
      [requestTypes.success]: (state, { payload: { entities, result } }) =>
        state
          .set('entities', fromJS(entities))
          .set('result', fromJS(result))
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
        const id = getIdFromPayload(action, idAttribute)
        return state.setIn(['ui', 'findingOne', id], true)
      },
      [requestTypes.success]: (state, action) => {
        const entity = getEntityFromAction(action, idAttribute)
        const id = entity[idAttribute]
        return state
          .setIn(['entities', id], fromJS(entity))
          .update('result', list => list.push(id))
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
        const entity = getEntityFromAction(action, idAttribute)
        const id = entity[idAttribute]
        return state
          .setIn(['entities', id], fromJS(entity))
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
        const id = getIdFromPayload(action, idAttribute)
        return state
          .setIn(['ui', 'updating', id], true)
      },
      [requestTypes.success]: (state, action) => {
        const entity = getEntityFromAction(action, idAttribute)
        const id = entity[idAttribute]
        return state
          .setIn(['entities', id], fromJS(entity))
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
        const id = getIdFromPayload(action, idAttribute)
        return state
          .setIn(['ui', 'deleting', id], true)
      },
      [requestTypes.success]: (state, action) => {
        const id = getIdFromPayload(action, idAttribute)
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

  if (actions['clear']) {
    const { type } = actions['clear']
    handlers[type] = () => initialState
  }

  if (actions['clearErrors']) {
    const { type } = actions['clearErrors']
    handlers[type] = state => state.delete('errors')
  }

  return handleActions(handlers, initialState)
}

// helpers

export function getEntities(reducerSubState: ?Map) {
  const empty: [?{}] = []
  if (!reducerSubState) { return empty }
  const entities = reducerSubState.get('entities')
  const result = reducerSubState.get('result')
  if (!entities || !result) { return empty }
  return result.toJS().map(id => entities.get(id).toJS())
}

export function getEntity(reducerSubState: ?Map, idAttribute: string) {
  if (!reducerSubState) { return }
  const entity = reducerSubState.getIn(['entities', idAttribute])
  return entity ? entity.toJS() : undefined
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

export const helpers = { getEntities, getEntity, getStatus }
