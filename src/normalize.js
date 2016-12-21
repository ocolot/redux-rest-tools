// @flow
import { Map, List, fromJS } from 'immutable'

import { get } from './helpers'

export default function normalize(data: {}|[{}], idPath: IdPathType) {
  return (Array.isArray(data) ? data : [data]).reduce((normalized, d) => {
    const key = get(d, idPath)
    return normalized
      .setIn(['entities', key], fromJS(d))
      .update('result', l => l.push(key))
  }, Map({
    entities: Map(),
    result: List(),
  }))
}
