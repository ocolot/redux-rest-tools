import React from 'react'

import User from '../containers/User'

const Users = ({ userList, pending }) => {
  if (pending) {
    return (<div>Loading...</div>)
  }

  return (
    <div>
      {userList && userList.map((login, index) =>
        <User login={login} key={index} />
      )}
    </div>
  )
}

export default Users
