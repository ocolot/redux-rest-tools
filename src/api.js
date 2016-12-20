// @flow
import axios from 'axios'

function replaceUrlParams(route, action) {
  let url = route
  const urlParams = url.match(/:[_a-zA-Z]+\b/g)

  if (urlParams) {
    for (const urlParam of urlParams) {
      const key = urlParam.substring(1)
      const value = action.payload && action.payload[key]
      if (!value) { throw new Error(`Key ${key} missing in action ${action.type}`) }
      url = url.replace(urlParam, value)
    }
  }
  return url
}

export default function api(requestConfig: RequestConfigType, action: ActionType) {
  const { route, ...config } = requestConfig
  config.url = replaceUrlParams(route, action)

  if (!config.method) { throw new Error('Method missing in watchRequest config') }
  const method = config.method.toLowerCase()
  if (['post', 'put', 'patch'].includes(method)) {
    config.data = action.payload
  }
  if (method === 'get') {
    // TODO only add params that were not replaced in route
    config.params = action.payload
  }

  return axios
    .request(config)
    .then(response => {
      if (!response.data) { throw new Error('Response data missing in api response') }
      return response.data
    })
}
