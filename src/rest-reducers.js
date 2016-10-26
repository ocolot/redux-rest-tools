// @flow
import { handleActions } from 'redux-actions'
import { fromJS, Map } from 'immutable'

const initialState = fromJS({
  entities: {},
  ui: {
    fetching: false,
    submitting: false,
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

const verbHandlers = {
  find(requestTypes, idAttribute) {
    return {
      [requestTypes.request]: (state) =>
        state.setIn(['ui', 'fetching'], true),
      [requestTypes.success]: (state, { payload: { entities, result } }) =>
        state
          .set('entities', fromJS(entities))
          .set('result', result)
          .setIn(['ui', 'fetching'], false),
      [requestTypes.fail]: (state, { payload: error }) =>
        state
          .setIn(['errors', 'find'], fromJS(error))
          .setIn(['ui', 'fetching'], false),
    }
  },
  findOne(requestTypes, idAttribute) {
    // NOTE: add entity to entities
    return {
      [requestTypes.request]: (state, { payload: { idAttribute } }) =>
        state.setIn(['ui', 'findingOne', idAttribute], true),
      [requestTypes.success]: (state, { payload: { entities, result: [idAttribute, ...rest] } }) =>
        state
          .setIn(['entities', idAttribute], entities[idAttribute])
          .update('result', list => list.push(idAttribute))
          .deleteIn(['ui', 'findingOne', idAttribute]),
      [requestTypes.fail]: (state, { payload: error }) =>
        state
          .setIn(['errors', 'findOne'], fromJS(error))
          .setIn(['ui', 'findingOne'], Map()),
    }
  },
  create(requestTypes, idAttribute) {
    // NOTE: add entity to entities
    return {
      [requestTypes.request]: (state) =>
        state
          .setIn(['ui', 'creating'], true)
          .setIn(['ui', 'submitting'], true),
      [requestTypes.success]: (state, { payload: { entities, result: [idAttribute, ...rest] } }) =>
        state
          .setIn(['entities', idAttribute], entities[idAttribute])
          .update('result', list => list.push(idAttribute))
          .setIn(['ui', 'creating'], false)
          .setIn(['ui', 'submitting'], false),
      [requestTypes.fail]: (state, { payload: error }) =>
        state
          .setIn(['errors', 'create'], fromJS(error))
          .setIn(['ui', 'creating'], false)
          .setIn(['ui', 'submitting'], false),
    }
  },
  update(requestTypes, idAttribute) {
    // NOTE: idAttribute cannot change
    return {
      [requestTypes.request]: (state, { payload: { idAttribute } }) =>
        state
          .setIn(['ui', 'updating', idAttribute], true)
          .setIn(['ui', 'submitting'], true),
      [requestTypes.success]: (state, { payload: { entities, result: [idAttribute, ...rest] } }) =>
        state
          .setIn(['entities', idAttribute], entities[idAttribute])
          .deleteIn(['ui', 'updating', idAttribute])
          .setIn(['ui', 'submitting'], false),
      [requestTypes.fail]: (state, { payload: error }) =>
        state
          .setIn(['errors', 'update'], fromJS(error))
          .setIn(['ui', 'updating'], Map())
          .setIn(['ui', 'submitting'], false),
    }
  },
  delete(requestTypes, idAttribute) {
    return {
      [requestTypes.request]: (state, { payload: { idAttribute } }) =>
        state
          .setIn(['ui', 'deleting', idAttribute], true)
          .setIn(['ui', 'submitting'], true),
      [requestTypes.success]: (state, { payload: { idAttribute } }) =>
        state
          .delete(idAttribute)
          .update('result', list => list.filter(entity => (entity !== idAttribute)))
          .deleteIn(['ui', 'deleting', idAttribute])
          .setIn(['ui', 'submitting'], false),
      [requestTypes.fail]: (state, { payload: error }) =>
        state
          .setIn(['errors', 'delete'], fromJS(error))
          .setIn(['ui', 'deleting'], Map())
          .setIn(['ui', 'submitting'], false),
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

export function getEntities(state: {}, collection: string) {
  return state[collection].get('entities').toArray().map(entity => entity.toJS())
}

export function getEntity(state: {}, collection: string, idAttribute: string) {
  const entity = state[collection].getIn(['entities', idAttribute])
  return entity ? entity.toJS() : undefined
}

export function getFetching(state: {}, collection: string, idAttribute: ?string) {
  if (idAttribute) {
    return state[collection].getIn(['ui', 'findingOne', idAttribute])
  }
  return state[collection].getIn(['ui', 'fetching'])
}

export const helpers = { getEntities, getEntity, getFetching }
