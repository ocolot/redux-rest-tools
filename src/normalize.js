// @flow
import { Map, List, fromJS } from 'immutable'

export default function normalize(data: {}|[{}], idAttribute: string|() => string) {
  return (Array.isArray(data) ? data : [data]).reduce((normalized, d) => {
    const id = typeof idAttribute === 'function' ? idAttribute(d) : d[idAttribute]
    return normalized
      .setIn(['entities', id], fromJS(d))
      .update('result', l => l.push(id))
  }, Map({
    entities: Map(),
    result: List(),
  }))
}
