import { connect } from 'react-redux'
import { getEntity } from 'redux-rest-tools'

import User from '../components/User'
import actions from '../actions'

const mapStateToProps = (state, { login }) => ({
  user: getEntity(state.get('users'), login), // get the user entity from the state sliced managed by the REST reducer
})

const mapDispatchToProps = {
  findOne: login => actions.users.findOne.request({ login }), // login will be passed as a URL parameter
}

export default connect(mapStateToProps, mapDispatchToProps)(User)
