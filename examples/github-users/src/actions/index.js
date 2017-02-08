/*
  Create actions to handle the find and findOne REST verbs.
  Each verb will be used to generate the respective middleware and reducer.
 */
import { createRestActions } from 'redux-rest-tools'

export default {
  users: createRestActions({
    collection: 'users',
    verbs: ['find', 'findOne'],
  }),
}
