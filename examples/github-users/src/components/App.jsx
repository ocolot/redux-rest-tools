import React from 'react'

import Users from '../containers/Users'

const App = ({ find }) =>
  <div>
    <p>
      <em>
        Use <a href="https://github.com/zalmoxisus/redux-devtools-extension" target="_blank">redux-devtools-extension</a> to observe the app's state and actions.
      </em>
    </p>
    <p>
      <em>
        Users are fetched from the <a href="https://developer.github.com/v3/users/" target="_blank">users</a> endpoint of Github's REST API.
      </em>
    </p>

    <h1>Github users</h1>
    <button
      onClick={() => find()}
      style={{ marginBottom: 20 }}
    >Find users</button>
    <Users />
  </div>

export default App
