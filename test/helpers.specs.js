import expect from 'expect'
import { fromJS, Iterable } from 'immutable'

import { getEntities, getEntity, getStatus } from '../src/helpers'
import { black, white, red } from './dummies'

describe('helpers', () => {
  const state = fromJS({
    entities: {
      [black.name]: black,
      [white.name]: white,
      [red.name]: red,
    },
    result: [white.name, red.name, black.name],
  })

  describe('getEntities', () => {
    describe('(immutable)', () => {
      it('should return entities array ordered by result', () => {
        const entities = getEntities(state)
        expect(Iterable.isIterable(entities)).toBe(true)
        expect(entities.equals(fromJS([white, red, black]))).toBe(true)
      })

      it('should return entities array ordered by result (reverse)', () => {
        const entities = getEntities(state, { reverse: true })
        expect(Iterable.isIterable(entities)).toBe(true)
        expect(entities.equals(fromJS([black, red, white]))).toBe(true)
      })
    })

    describe('(js)', () => {
      it('should return entities array ordered by result', () => {
        const entities = getEntities(state, { immutable: false })
        expect(Iterable.isIterable(entities)).toBe(false)
        expect(entities).toEqual([white, red, black])
      })

      it('should return entities array ordered by result (reverse)', () => {
        const entities = getEntities(state, { reverse: true, immutable: false })
        expect(Iterable.isIterable(entities)).toBe(false)
        expect(entities).toEqual([black, red, white])
      })
    })
  })

  describe('getEntity', () => {
    describe('(immutable)', () => {
      it('should return entity', () => {
        const entity = getEntity(state, 'black')
        expect(Iterable.isIterable(entity)).toBe(true)
        expect(entity.equals(fromJS(black))).toBe(true)
      })
    })

    describe('(js)', () => {
      it('should return entity', () => {
        const entity = getEntity(state, 'black', { immutable: false })
        expect(Iterable.isIterable(entity)).toBe(false)
        expect(entity).toEqual(black)
      })
    })
  })

  describe('getStatus', () => {
    const state = fromJS({
      ui: {
        finding: true,
        findingOne: { black: true },
        creating: true,
        updating: { black: true },
        deleting: { black: true },
      },
    })
    it('should return status', () => {
      for (const status of ['finding', 'creating']) {
        expect(getStatus(state, status)).toBe(true, `should return ${status} status`)
      }
      for (const status of ['findingOne', 'updating', 'deleting']) {
        expect(getStatus(state, status, 'black')).toBe(true, `should return ${status} status`)
      }
    })
  })
})
