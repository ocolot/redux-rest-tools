import { connect } from 'react-redux'

import App from '../components/App'
import actions from '../actions'

const mapDispatchToProps = {
  find: actions.users.find.request,
}

export default connect(undefined, mapDispatchToProps)(App)
