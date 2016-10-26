import expect from 'expect'
import { fromJS } from 'immutable'
import { restReducer, createRestActions, getEntities, getEntity, getStatus } from '../src'
import { getIdFromPayloadKey, getEntityFromAction } from '../src/rest-reducers'

describe('restReducer', () => {
  const actions = createRestActions({
    collection: 'cats',
    verbs: ['find', 'findOne', 'create', 'update', 'delete'],
  })
  const reducer = restReducer({
    idAttribute: 'name', // TODO: test when function(entity) { return entity.name }
    actions,
  })

  describe('getIdFromPayloadKey', () => {
    it('should return idAttribute from payload (idAttribute: string)', () => {
      const action = { payload: { name: 'black' } }
      expect(getIdFromPayloadKey(action, 'name')).toBe('black')
    })

    it('should return idAttribute from payload (idAttribute: function)', () => {
      const action = { type: 'test', payload: { name: 'black' } }
      const idAttribute = entity => entity.name
      expect(getIdFromPayloadKey(action, idAttribute)).toBe('black')
    })

    it('should throw if idAttribute not found', () => {
      const actions = [
        { type: 'test' },
        { type: 'test', payload: { type: 'grumpy' } },
      ]
      for (const action of actions) {
        expect(getIdFromPayloadKey.bind(this, action, 'name')).toThrow()
      }
    })
  })

  describe('getEntityFromAction', () => {
    it('should return entity from action', () => {
      const entity = { name: 'black', type: 'grumpy' }
      const action = { payload: { entities: { [entity.name]: entity }, result: [entity.name] } }
      expect(getEntityFromAction(action, 'name')).toEqual(entity)
    })

    it('should throw if action malformed', () => {
      const actions = [
        { type: 'test' },
        { type: 'test', payload: {} },
        { type: 'test', payload: { entities: {} } },
        { type: 'test', payload: { entities: { black: {} } } },
        { type: 'test', payload: { result: ['black'] } },
        { type: 'test', payload: { entities: { black: {} }, result: ['white'] } },
      ]
      for (const action of actions) {
        expect(getEntityFromAction.bind(this, action, 'name')).toThrow()
      }
    })
  })

  it('should return initialState with undefined action')

  it('should return initialState', () => {
    expect(reducer(undefined, { type: 'none'}).toJS()).toEqual({
      entities: {},
      result: [],
      ui: {
        finding: false,
        findingOne: {},
        creating: false,
        updating: {},
        deleting: {},
      },
    })
  })

  describe('find', () => {
    describe('request', () => {
      it('should set ui.finding to true', () => {
        const state = reducer(undefined, actions.find.request({ name: 'black' }))
        expect(state.getIn(['ui', 'finding'])).toBe(true)
      })

      it('should clear entities', () => {
        const red = { name: 'red', type: 'dizzy' }
        let state = reducer(undefined, actions.find.success({
          entities: { red },
          result: ['red'],
        }))
        state = reducer(undefined, actions.find.request({ name: 'black' }))
        expect(state.get('entities').count()).toBe(0)
      })
    })

    describe('success', () => {
      let state = reducer(undefined, actions.find.request({ name: 'black' }))
      const black = { name: 'black', type: 'grumpy' }
      const white = { name: 'white', type: 'happy' }

      state = reducer(state, actions.find.success({
        entities: { black, white },
        result: ['black', 'white'],
      }))

      it('should set ui.finding to false', () => {
        expect(state.getIn(['ui', 'finding'])).toBe(false)
      })

      it('should replace entities', () => {
        expect(state.get('entities').toJS()).toEqual({ black, white})
      })

      it('should replace result', () => {
        expect(state.get('result').toJS()).toEqual(['black', 'white'])
      })
    })

    describe('fail', () => {
      let state = reducer(undefined, actions.find.request({ name: 'black' }))
      const error = new Error('test')
      state = reducer(state, actions.find.fail(error))

      it('should set ui.finding to false', () => {
        expect(state.getIn(['ui', 'finding'])).toBe(false)
      })

      it('should set errors.find to error', () => {
        expect(state.getIn(['errors', 'find'])).toBe(error)
      })
    })
  })

  describe('findOne', () => {
    describe('request', () => {
      it('should set ui.findingOne[idAttribute] to true', () => {
        const state = reducer(undefined, actions.findOne.request({ name: 'black' }))
        expect(state.getIn(['ui', 'findingOne', 'black'])).toBe(true)
      })
    })

    describe('success', () => {
      let state = reducer(undefined, actions.findOne.request({ name: 'black' }))
      const entity = { name: 'black', type: 'grumpy' }
      state = reducer(state, actions.findOne.success({
        entities: {
          black: entity,
        },
        result: ['black'],
      }))

      it('should set ui.findingOne[idAttribute] to not exist', () => {
        expect(state.getIn(['ui', 'findingOne', 'black'])).toNotExist()
      })

      it('should add entity to entities', () => {
        expect(state.getIn(['entities', 'black']).toJS()).toEqual(entity)
      })

      it('should add idAttribute to result', () => {
        expect(state.get('result').includes('black')).toBe(true)
      })

      it('should keep existing entities', () => {
        state = reducer(state, actions.findOne.success({
          entities: {
            white: { name: 'white', type: 'happy' },
          },
          result: ['white'],
        }))

        expect(state.getIn(['entities', 'black']).toJS()).toEqual(entity)
        expect(state.get('result').includes('black')).toBe(true)
      })
    })

    describe('fail', () => {
      let state = reducer(undefined, actions.findOne.request({ name: 'black' }))
      const error = new Error('test')
      state = reducer(state, actions.findOne.fail(error))

      it('should set ui.findingOne[idAttribute] to not exist', () => {
        expect(state.getIn(['ui', 'findingOne', 'black'])).toNotExist()
      })

      it('should set errors.findOne to error', () => {
        expect(state.getIn(['errors', 'findOne'])).toBe(error)
      })
    })
  })

  describe('create', () => {
    describe('request', () => {
      it('should set ui.creating to true', () => {
        const state = reducer(undefined, actions.create.request({ name: 'black' }))
        expect(state.getIn(['ui', 'creating'])).toBe(true)
      })
    })

    describe('success', () => {
      let state = reducer(undefined, actions.create.request({ name: 'black' }))
      const entity = { name: 'black', type: 'grumpy' }
      state = reducer(state, actions.create.success({
        entities: {
          black: entity,
        },
        result: ['black'],
      }))

      it('should set ui.creating to false', () => {
        expect(state.getIn(['ui', 'creating'])).toBe(false)
      })

      it('should add entity to entities', () => {
        expect(state.getIn(['entities', 'black']).toJS()).toEqual(entity)
      })

      it('should add idAttribute to result', () => {
        expect(state.get('result').includes('black')).toBe(true)
      })

      it('should keep existing entities', () => {
        state = reducer(state, actions.create.success({
          entities: {
            white: { name: 'white', type: 'happy' },
          },
          result: ['white'],
        }))

        expect(state.getIn(['entities', 'black']).toJS()).toEqual(entity)
        expect(state.get('result').includes('black')).toBe(true)
      })
    })

    describe('fail', () => {
      let state = reducer(undefined, actions.create.request({ name: 'black' }))
      const error = new Error('test')
      state = reducer(state, actions.create.fail(error))

      it('should set ui.creating to false', () => {
        expect(state.getIn(['ui', 'creating'])).toBe(false)
      })

      it('should set errors.create to error', () => {
        expect(state.getIn(['errors', 'create'])).toBe(error)
      })
    })
  })

  describe('update', () => {
    describe('request', () => {
      const state = reducer(undefined, actions.update.request({ name: 'black' }))
      it('should set ui.updating[idAttribute] to true', () => {
        expect(state.getIn(['ui', 'updating', 'black'])).toBe(true)
      })
    })

    describe('success', () => {
      let state = reducer(undefined, { type: 'test' })
      const entity = { name: 'black', type: 'grumpy' }
      state = reducer(undefined, actions.findOne.success({
        entities: {
          black: entity,
        },
        result: ['black'],
      }))
      const updatedEntity = { ...entity, type: 'no.'}
      state = reducer(state, actions.update.success({
        entities: {
          black: updatedEntity,
        },
        result: ['black'],
      }))

      it('should set ui.findingOne[idAttribute] to not exist', () => {
        expect(state.getIn(['ui', 'updating', 'black'])).toNotExist()
      })

      it('should update entity', () => {
        expect(state.getIn(['entities', 'black']).toJS()).toEqual(updatedEntity)
      })

      it('should keep idAttribute in result', () => {
        expect(state.get('result').includes('black')).toBe(true)
      })

      it('should keep existing entities', () => {
        state = reducer(state, actions.update.success({
          entities: {
            white: { name: 'white', type: 'happy' },
          },
          result: ['white'],
        }))

        expect(state.getIn(['entities', 'black']).toJS()).toEqual(updatedEntity)
        expect(state.get('result').includes('black')).toBe(true)
      })
    })

    describe('fail', () => {
      let state = reducer(undefined, actions.update.request({ name: 'black' }))
      const error = new Error('test')
      state = reducer(state, actions.update.fail(error))

      it('should set ui.updating[idAttribute] to not exist', () => {
        expect(state.getIn(['ui', 'updating', 'black'])).toNotExist()
      })

      it('should set errors.findOne to error', () => {
        expect(state.getIn(['errors', 'update'])).toBe(error)
      })
    })
  })

  describe('delete', () => {
    describe('request', () => {
      it('should set ui.deleting[idAttribute] to true', () => {
        const state = reducer(undefined, actions.delete.request({ name: 'black' }))
        expect(state.getIn(['ui', 'deleting', 'black'])).toBe(true)
      })
    })

    describe('success', () => {
      let state = reducer(undefined, { type: 'test' })
      state = reducer(state, actions.findOne.success({
        entities: {
          black: { name: 'black', type: 'grumpy' },
        },
        result: ['black'],
      }))
      state = reducer(state, actions.delete.request({ name: 'black' }))
      state = reducer(state, actions.delete.success({ name: 'black' }))

      it('should set ui.deleting[idAttribute] to not exist', () => {
        expect(state.getIn(['ui', 'deleting', 'black'])).toNotExist()
      })

      it('should remove entity to entities', () => {
        expect(state.getIn(['entities', 'black'])).toNotExist()
      })

      it('should remove idAttribute to result', () => {
        expect(state.get('result').includes('black')).toBe(false)
      })

      it('should keep other entities', () => {
        const white = { name: 'white', type: 'happy' }
        state = reducer(state, actions.find.success({
          entities: {
            white: { name: 'white', type: 'happy' },
            black: { name: 'black', type: 'grumpy' },
          },
          result: ['white', 'black'],
        }))
        state = reducer(state, actions.delete.success({ name: 'black' }))

        expect(state.getIn(['entities', 'black'])).toNotExist()
        expect(state.get('result').includes('black')).toBe(false)
        expect(state.getIn(['entities', 'white']).toJS()).toEqual(white)
        expect(state.get('result').includes('white')).toBe(true)
      })
    })

    describe('fail', () => {
      let state = reducer(undefined, actions.delete.request({ name: 'black' }))
      const error = new Error('test')
      state = reducer(state, actions.delete.fail(error))

      it('should set ui.deleting[idAttribute] to not exist', () => {
        expect(state.getIn(['ui', 'deleting', 'black'])).toNotExist()
      })

      it('should set errors.delete to error', () => {
        expect(state.getIn(['errors', 'delete'])).toBe(error)
      })
    })
  })

  describe('helpers', () => {
    const black = { name: 'black', type: 'grumpy' }
    const white = { name: 'white', type: 'happy' }
    const red = { name: 'red', type: 'dizzy' }
    let state = reducer(undefined, { type: 'test' })
    state = reducer(state, actions.find.success({
      entities: { black, white, red },
      result: ['white', 'red', 'black'],
    }))

    describe('getEntities', () => {
      it('should return entities array ordered by result', () => {
        const entities = getEntities(state)
        expect(entities).toEqual([white, red, black])
      })

      it('should return entities array ordered by result (reverse)', () => {
        const entities = getEntities(state, { reverse: true })
        expect(entities).toEqual([black, red, white])
      })
    })

    describe('getEntity', () => {
      it('should return entity', () => {
        const entity = getEntity(state, 'black')
        expect(entity).toEqual(black)
      })
    })

    describe('getStatus', () => {
      let state = reducer(undefined, { type: 'test' })
      it('should return status', () => {
        for (const status of ['finding', 'creating']) {
          state = state.setIn(['ui', status], true)
          expect(getStatus(state, status)).toBe(true)
        }
        for (const status of ['findingOne', 'updating', 'deleting']) {
          state = state.setIn(['ui', status, 'black'], true)
          expect(getStatus(state, status, 'black')).toBe(true)
        }
      })
    })
  })
})
