// @flow
import axios from 'axios'

import { get } from './helpers'

export function replaceRouteParams(route: string, action: ActionType) {
  const urlParams = route.match(/:[_a-zA-Z\.]+\b/g)

  if (!urlParams) { return route }

  return urlParams.reduce((url, urlParam) => {
    const path = urlParam.substring(1)
    const value = get(action.payload, path)
    if (!value) { throw new Error(`Key ${path} missing in action ${action.type}`) }
    return url.replace(urlParam, value)
  }, route)
}

export default function request(requestConfig: RequestConfigType, action: ActionType) {
  const { route, ...config } = requestConfig
  config.url = replaceRouteParams(route, action)

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
