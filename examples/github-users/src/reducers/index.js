/*
  Create reducer to handle Github users.
  It spawns based on the REST verbs found in actions (e.g. find, findOne).
*/
import { combineReducers } from 'redux-immutable' // the whole state is an immutable object
import { restReducer } from 'redux-rest-tools'

import actions from '../actions'

const users = restReducer({
  idPath: 'login', // the unique identifier used for each object
  actions: actions.users, // the rest actions to handle
})

const rootReducer = combineReducers({
  users,
  // ...add your other reducers
})

export default rootReducer
