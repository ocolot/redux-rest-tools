/*
  Create a middleware to handle async actions to call the Github API.
  It is generate based on the REST verbs found in actions (e.g. find and findOne).
 */
import { middleware } from 'redux-rest-tools'

import actions from '../actions'

const users = middleware({
  baseRoute: 'https://api.github.com/users', // the REST API endpoint
  actions: actions.users, // REST actions (find and findOne keys will be used to define the REST middleware in this case)
  idPath: 'login', // e.g. findOne route will look like https://api.github.com/users/:login
})

export default [
  users,
  // add other middlewares here
]
