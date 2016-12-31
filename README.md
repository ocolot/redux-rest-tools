# Redux REST tools

[![build status](https://img.shields.io/travis/ocolot/redux-rest-tools.svg)](https://travis-ci.org/ocolot/redux-rest-tools)
[![npm version](https://img.shields.io/npm/v/redux-rest-tools.svg)](https://www.npmjs.com/package/redux-rest-tools)
[![downloads per month](https://img.shields.io/npm/dm/redux-rest-tools.svg)](https://www.npmjs.com/package/redux-rest-tools)

Redux REST tools is an opinionated library to handle API calls in [Redux](http://redux.js.org) apps. It provides action creators, reducers generator, state normalization and a middleware to handle the request flow... with the [REST](https://en.wikipedia.org/wiki/Representational_state_transfer) convention in mind. It is meant to ease HTTP requests and data handling while ensuring performance and state consistency.

[**REST action creators**](/docs/api/actions/README.md) use [`redux-actions`](https://github.com/acdlite/redux-actions) under the hood to create [FSA-complient](https://github.com/acdlite/flux-standard-action) set of actions. For each request, a `request`, `success` and `fail` action creator will be generate with the possibility to pass success/failure handlers to deal with the consequences of a successful/failed API request.

[**REST reducers**](/docs/api/reducers/README.md) use [`immutable`](http://facebook.github.io/immutable-js) objects for their [slice](http://redux.js.org/docs/faq/Reducers.html) of the state (but the whole state is not required to se immutable). They handle immutable and JS action payloads for state update, but immutable data structure are preferred to increase state update performance and reduce from/to JS conversion efforts (note: in a [React](https://facebook.github.io/react) app, you might avoid using `toJS()` in [`mapStateToProps`](https://github.com/reactjs/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options) to speed up UI refresh pace).

Each state slice managed by a REST reducer is [**normalized**](/docs/api/normalizer/README.md) based on the entities' unique identifiers (e.g. the object ID, see `idPath`). Their shapes look like `{ result: [...], entities: {...}, ui: {...}, errors: {...} }`, where `result` is the list of entity IDs, `entities` is an object where each key is an entity ID and its content is the entity itself, `ui` is used to store request states, and `errors` the errors that may occur during the API calls.

The [**REST middleware**](/docs/api/middleware/README.md) handles the async request flow. It starts with a `request` action triggering the actual HTTP request using [`axios`](https://github.com/mzabriskie/axios). If the request succeed, the `success` action is dispatched; else the `fail` action is dispatched. To deal with the consequences of a successful/failed request, you may pass `onSuccessAction`/`onFailAction` action creators and `onSuccess`/`onFail` function in the request action meta to be called with the request results.

### Installation

To install the stable version with [npm](https://www.npmjs.com):

```
npm install --save redux-rest-tools
```

or with [yarn](https://yarnpkg.com):

```
yarn add redux-rest-tools
```

### Usage

_Coming soon..._

### Documentation

[See full documentation](https://ocolot.github.io/redux-rest-tools)

### Contribution & Feedback

`redux-rest-tools` is at an early stage of development. You are more than welcome to provide feedback and contribute to the development of the project.

Please search the [existing issues](https://github.com/ocolot/redux-rest-tools/issues) to follow up on open/closed discussions.

### License

MIT
