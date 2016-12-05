import expect from 'expect'
import Immutable, { fromJS, List, Iterable } from 'immutable'

import { createRestActions } from '../src/actions'
import {
  restReducer, getIdFromPayloadKey, getEntity, getEntityId, initialState,
} from '../src/reducers'
import { black, white, normalizedCats } from './dummies'

function shouldHandleImmutablePayload(action) {
  it('should handle immutable payload without js conversion', () => {
    const fromJSSpy = expect.spyOn(Immutable, 'fromJS')
    const toJSSpy = expect.spyOn(action.payload, 'toJS')
    expect(fromJSSpy).toNotHaveBeenCalled()
    expect(toJSSpy).toNotHaveBeenCalled()
    toJSSpy.restore()
    fromJSSpy.restore()
  })
}

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

  describe('getEntity', () => {
    it('should return entity from action', () => {
      const action = { payload: black }
      expect(getEntity(action).toJS()).toEqual(black)
    })

    it('should throw if action malformed', () => {
      const actions = [
        {},
        { type: 'test' },
        { type: 'test', payload: undefined },
      ]
      for (const action of actions) {
        expect(getEntity.bind(this, action)).toThrow()
      }
    })
  })

  describe('getEntityId', () => {
    const entity = fromJS(black)
    it('should throw if id undefined', () => {
      expect(getEntityId.bind(this, entity, 'does_not_exist', 'TEST_TYPE')).toThrow()
    })

    it('should return entity id', () => {
      expect(getEntityId(entity, 'name', 'TEST_TYPE')).toBe('black')
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

      state = reducer(state, actions.find.success(normalizedCats))

      it('should set ui.finding to false', () => {
        expect(state.getIn(['ui', 'finding'])).toBe(false)
      })

      it('should replace entities', () => {
        expect(state.get('entities').toJS()).toEqual(normalizedCats.entities)
      })

      it('should replace result', () => {
        expect(state.get('result').toJS()).toEqual(normalizedCats.result)
      })

      shouldHandleImmutablePayload(actions.find.success(fromJS(normalizedCats)))
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

      state = reducer(state, actions.findOne.success(black))

      it('should set ui.findingOne[idAttribute] to not exist', () => {
        expect(state.getIn(['ui', 'findingOne', 'black'])).toNotExist()
      })

      it('should add entity to entities', () => {
        expect(state.getIn(['entities', 'black']).toJS()).toEqual(black)
      })

      it('should add idAttribute to result', () => {
        expect(state.get('result').includes('black')).toBe(true)
      })

      it('should keep existing entities', () => {
        state = reducer(state, actions.findOne.success(white))

        expect(state.getIn(['entities', 'black']).toJS()).toEqual(black)
        expect(state.get('result').includes('black')).toBe(true)
      })

      it('should add idAttribute once to result', () => {
        let state = reducer(undefined, actions.findOne.success(black))
        state = reducer(state, actions.findOne.success(black))
        expect(state.get('result').count(r => r === 'black')).toBe(1)
      })

      shouldHandleImmutablePayload(actions.findOne.success(fromJS(black)))
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
      state = reducer(state, actions.create.success(black))

      it('should set ui.creating to false', () => {
        expect(state.getIn(['ui', 'creating'])).toBe(false)
      })

      it('should add entity to entities', () => {
        expect(state.getIn(['entities', 'black']).toJS()).toEqual(black)
      })

      it('should add idAttribute to result', () => {
        expect(state.get('result').includes('black')).toBe(true)
      })

      it('should keep existing entities', () => {
        state = reducer(state, actions.create.success(white))

        expect(state.getIn(['entities', 'black']).toJS()).toEqual(black)
        expect(state.get('result').includes('black')).toBe(true)
      })

      shouldHandleImmutablePayload(actions.create.success(fromJS(black)))
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
      state = reducer(undefined, actions.findOne.success(black))

      const updatedEntity = { ...black, type: 'no.'}
      state = reducer(state, actions.update.success(updatedEntity))

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
        state = reducer(state, actions.update.success(white))

        expect(state.getIn(['entities', 'black']).toJS()).toEqual(updatedEntity)
        expect(state.get('result').includes('black')).toBe(true)
      })

      shouldHandleImmutablePayload(actions.update.success(fromJS(black)))
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
      state = reducer(state, actions.findOne.success(black))
      state = reducer(state, actions.delete.request({ name: 'black' }))
      state = reducer(state, actions.delete.success(black))

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
        state = reducer(state, actions.find.success({
          entities: {
            white,
            black,
          },
          result: ['white', 'black'],
        }))
        state = reducer(state, actions.delete.success(black))

        expect(state.getIn(['entities', 'black'])).toNotExist()
        expect(state.get('result').includes('black')).toBe(false)
        expect(state.getIn(['entities', 'white']).toJS()).toEqual(white)
        expect(state.get('result').includes('white')).toBe(true)
      })

      shouldHandleImmutablePayload(actions.delete.success(fromJS(black)))
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

  describe('clear', () => {
    it('should reset state to initialState', () => {
      const black = { name: 'black', type: 'grumpy' }
      let state = reducer(undefined, actions.find.success({
        entities: { black },
        result: ['black'],
      }))
      state = reducer(state, actions.clear())
      expect(state.toJS()).toEqual(initialState.toJS())
    })
  })

  describe('clearErrors', () => {
    it('should clear errors', () => {
      const init = fromJS({
        errors: { damn: 'it' },
      })

      const state = reducer(init, actions.clearErrors())
      expect(state.get('errors')).toBe(undefined)
    })
  })
})
