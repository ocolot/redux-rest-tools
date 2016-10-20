// @flow
import { handleActions } from 'redux-actions'
import { fromJS, Map } from 'immutable'

export const initialState = fromJS({
  entities: {},
  ui: {
    fetching: false,
    submitting: false,
    findingOne: {},
    updating: {},
    deleting: {},
  },
})

type RestReducerConfig = {
  idAttribute: string,
  actions: {},
  extraHandlers: {},
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
    return {
      [requestTypes.request]: (state, { payload: { idAttribute } }) =>
        state.setIn(['ui', 'findingOne', idAttribute], true),
      [requestTypes.success]: (state, { payload: { entities, result } }) =>
        state
          .merge({ entities })
          .set('result', list => list.push(result[0]))
          .deleteIn(['ui', 'findingOne', result[0]]),
      [requestTypes.fail]: (state, { payload: error }) =>
        state
          .setIn(['errors', 'findOne'], fromJS(error))
          .setIn(['ui', 'findingOne'], Map()),
    }
  },
  create(requestTypes, idAttribute) {
    return {
      [requestTypes.request]: (state) =>
        state.setIn(['ui', 'submitting'], true),
      [requestTypes.success]: (state, { payload: { entities, result } }) =>
        state
          .setIn(['ui', 'submitting'], false)
          .merge({ entities })
          .set('result', list => list.push(result[0])),
      [requestTypes.fail]: (state, { payload: error }) =>
        state
          .setIn(['errors', 'create'], fromJS(error))
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
      [requestTypes.success]: (state, { payload: { entities, result } }) =>
        state
          .merge({ entities })
          .deleteIn(['ui', 'updating', result[0]])
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
      [requestTypes.success]: (state, { payload: { idAttribute, result } }) =>
        state
          .delete(idAttribute)
          .set('result', list => list.filter(entity => (entity !== result[0])))
          .deleteIn(['ui', 'deleting', result[0]])
          .setIn(['ui', 'submitting'], false),
      [requestTypes.fail]: (state, { payload: error }) =>
        state
          .setIn(['errors', 'delete'], fromJS(error))
          .setIn(['ui', 'deleting'], Map())
          .setIn(['ui', 'submitting'], false),
    }
  },
}

export function handlerCreator(verb, requestActions, idAttribute) {
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

export default function restReducer(config: RestReducerConfig) {
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
