import { connect } from 'react-redux'
import { getEntity } from 'redux-rest-tools'

import User from '../components/User'

const mapStateToProps = (state, { login }) => ({
  user: getEntity(state.get('users'), login),
})

export default connect(mapStateToProps)(User)
