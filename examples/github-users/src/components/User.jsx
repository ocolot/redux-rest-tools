import React from 'react'

const User = ({ user, findOne }) =>
  <div style={{ marginBottom: 10 }}>
    <img
      src={user.get('avatar_url')}
      style={{ width: 30, marginRight: 10 }}
      role="presentation"
    />
    <a
      href={user.get('html_url')}
      target="_blank"
    >
      {user.get('login')}
    </a>
    <button
      onClick={() => findOne(user.get('login'))}
      style={{ marginLeft: 10 }}
    >
      Fecth user (findOne example)
    </button>
  </div>

export default User
