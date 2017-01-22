/*
  Create a middleware to handle async actions to call the Github API.
 */
import { middleware } from 'redux-rest-tools'

import actions from '../actions'

const API_ROOT = 'https://api.github.com'

const users = middleware({
  baseRoute: [API_ROOT, 'users'].join('/'),
  actions: actions.users,
  idPath: 'login',
})

export default [
  users,
]
