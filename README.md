# Redux REST tools

[![build status](https://img.shields.io/travis/ocolot/redux-rest-tools.svg)](https://travis-ci.org/ocolot/redux-rest-tools)
[![npm version](https://img.shields.io/npm/v/redux-rest-tools.svg)](https://www.npmjs.com/package/redux-rest-tools)
[![downloads per month](https://img.shields.io/npm/dm/redux-rest-tools.svg)](https://www.npmjs.com/package/redux-rest-tools)

Redux REST tools is an opinionated library to handle API calls in [Redux](http://redux.js.org) apps. It provides action creators, reducers generator, state normalization tools and a middleware to handle the request flow... with the REST convention in mind. It is meant to ease API requests/data handling while ensuring performance and state consistency.

**REST action creators** use `redux-actions` under the hood to create FSA-complient set of actions (`{ type: string payload?: any, meta?: any }`). For each request, a `request`, `success` and `fail` action creator will be generate. The meta may contain `onSuccessAction`, `onSuccess`, `onFailAction`, `onFail` actions/action creators/functions to deal with the consequences of a successful/failed API request.

**REST reducers** use `immutable` objects for their slice of the state (but the whole state is not required to se immutable). They handle immutable and JS action payload for state update, but immutable data structure are preferred to increase state update performance and reduce from/to JS conversion effort (note: in a React app, you might avoid using `toJS()` in `mapStateToProps` to speed up UI refresh pace).

Each state slice managed by a REST reducer is **normalized** based on the entities' unique identifiers (e.g. the object ID, see `idPath`). Their shape look like `{ result: [...], entities: {...}, ui: {...}, errors: {...} }`, where `result` is the list of entity IDs, `entities` is an object where each key is an entity ID and its content is the entity itself, `ui` is used to store request states, and `errors` the errors that may occur during the API calls.

The **REST middleware** handles the async API call flow. The flow starts with a `request` action triggering the actual HTTP request using `axios`. If the request succeed, the `success` action is dispatched and `onSuccessAction` and `onSuccess` are dispatched and called with the request results if they were present in the request action meta. If it fails, the `fail` action is dispatched and the `onFailAction` and `onFail` are dispatched if they were present in the request action meta.

### Installation

To install the stable version with [npm](https://www.npmjs.com/):

```
npm install --save redux-rest-tools
```

or with yarn:

```
yarn add redux-rest-tools
```

### Usage

_Coming soon..._

### Contribution & Feedback

`redux-rest-tools` is at an early stage of development. You are more than welcome to provide feedback and contribute to the development of the project.

Please search the [existing issues](https://github.com/ocolot/redux-rest-tools/issues) to follow up on open/closed discussions.

### License

MIT
