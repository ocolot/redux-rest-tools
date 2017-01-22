import React from 'react'

const User = ({ user }) =>
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
  </div>

export default User
