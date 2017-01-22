import { connect } from 'react-redux'

import App from '../components/App'
import actions from '../actions'

const mapDispatchToProps = {
  find: actions.users.find.request, // request triggers the api call and the response will be handled by success or fail
}

export default connect(undefined, mapDispatchToProps)(App)
