// @flow
export const black = { name: 'black', type: 'grumpy' }
export const white = { name: 'white', type: 'happy' }
export const red = { name: 'red', type: 'dizzy' }
export const cats = [black, white, red]
export const normalizedBlack = { entities: { [black.name]: black }, result: [black.name]}
export const normalizedCats = {
  entities: {
    [black.name]: black,
    [white.name]: white,
    [red.name]: red,
  },
  result: [black.name, white.name, red.name],
}
