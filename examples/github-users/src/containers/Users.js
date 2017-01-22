import { connect } from 'react-redux'
import { getStatus } from 'redux-rest-tools'

import Users from '../components/Users'

const mapStateToProps = state => ({
  userList: state.getIn(['users', 'result']),
  pending: getStatus(state.get('users'), 'finding'),
})

export default connect(mapStateToProps)(Users)
