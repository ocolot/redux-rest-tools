/*
  Create actions to handle the find and findOne REST verbs.
 */
import { createRestActions } from 'redux-rest-tools'

export default {
  users: createRestActions({
    collection: 'groups',
    verbs: ['find', 'findOne'],
  }),
}
