// @flow
import { Map, List, fromJS } from 'immutable'

import { get } from './helpers'

/**
 * Normalizes data if it is an array.
 * @param  {object|[object]} data - the data to normalize.
 * @param  {IdPath} idPath - The path to the value to identify the REST entities (string, string array, function or string with dot seperaing keys).
 * @return {object} - The normalized data as an immutable object with the following keys: `result`, the list of object keys (see `idPath`) and `entities`, an object with each key containing the related entity.
 */
export default function normalize(data: {}|[{}], idPath: IdPath) {
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
