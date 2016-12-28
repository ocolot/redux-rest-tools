import expect from 'expect'
import { fromJS, Iterable } from 'immutable'
import axios from 'axios'

import { fetch } from '../src/sagas'
import * as api from '../src/api'
import { cats } from './dummies'

describe('middleware')
