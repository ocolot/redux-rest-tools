# Normalizer

## API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### normalize

Normalizes data if it is an array.

**Parameters**

-   `data` **([object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) | \[[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)])** the data to normalize.
-   `idPath` **IdPath** The path to the value to identify the REST entities (string, string array, function or string with dot separation).

Returns **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The normalized data object with the following keys: `result`, the list of object keys (see `idPath`) and `entities`, an object with each key containing the related entity.

### getEntities

Gets the entities from the state.

**Parameters**

-   `reducerSubState` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the part of the state handled by the REST reducer.
-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)?= getEntitiesOptionsDefault** the options may contain: `immutable` (boolean, defaults to true) to define if JS (requires a `toJS` conversion) or immutable objects (better for performance) should be returned; `reverse` (boolean, defaults to false) to return the objects in reverse order.

Returns **oject** The entities from the state (immutable list or JS array depending on the configuration).

### getEntity

Gets an entity from the state.

**Parameters**

-   `reducerSubState` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the part of the state handled by the REST reducer.
-   `key` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the key of the entity to retrieve (the value returned by the specified `idPath`).
-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)?= getEntityOptionsDefault** the options to use. `immutable`: boolean to specify if the returned object should be immutable (defaults to true).

Returns **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The entity (immutable map or JS array depending on the configuration).

### getStatus

Gets the status of the request.

**Parameters**

-   `reducerSubState` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the part of the state handled by the REST reducer.
-   `status` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** one of `finding`, `findingOne`, `creating`, `updating` or `deleting`.
-   `key` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** (optional) - the key of the entity (the value returned by the specified `idPath`).

Returns **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** `true` if the request is pending, else `false`.

### handlerCreator

Creates the handler function to handle the REST request actions (request, success, fail).

**Parameters**

-   `verb` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The verb to handle (find, findOne, create, update or delete).
-   `requestActions` **RequestActions** An object containing the request, success and fail action creators to handle.
-   `idPath` **IdPath** The path to the value to identify the REST entities (string, string array, function or string with dot separation).

Returns **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** An object containing the functions to handle request, success and fail state change in the reducer.

### restReducer

Creates a REST reducer to handle the defined actions.

**Parameters**

-   `config` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The REST reducer config with the following keys: `idPath`, the path to the identifier of the requested objects (string, array of string or function); `actions`: the REST actions to handle; `extraHandlers`: an object where each key is the action type to handle and each key contains a function to handle the state change for these actions.

Returns **Reducer** A reducer to handle REST requests state changes.

## normalize

Normalizes data if it is an array.

**Parameters**

-   `data` **([object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| \[[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)])** the data to normalize.
-   `idPath` **IdPath** The path to the value to identify the REST entities (string, string array, function or string with dot separation).

Returns **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The normalized data object with the following keys: `result`, the list of object keys (see `idPath`) and `entities`, an object with each key containing the related entity.

## getEntities

Gets the entities from the state.

**Parameters**

-   `reducerSubState` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the part of the state handled by the REST reducer.
-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)?= getEntitiesOptionsDefault** the options may contain: `immutable` (boolean, defaults to true) to define if JS (requires a `toJS` conversion) or immutable objects (better for performance) should be returned; `reverse` (boolean, defaults to false) to return the objects in reverse order.

Returns **oject** The entities from the state (immutable list or JS array depending on the configuration).

## getEntity

Gets an entity from the state.

**Parameters**

-   `reducerSubState` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the part of the state handled by the REST reducer.
-   `key` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the key of the entity to retrieve (the value returned by the specified `idPath`).
-   `options` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)?= getEntityOptionsDefault** the options to use. `immutable`: boolean to specify if the returned object should be immutable (defaults to true).

Returns **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The entity (immutable map or JS array depending on the configuration).

## getStatus

Gets the status of the request.

**Parameters**

-   `reducerSubState` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the part of the state handled by the REST reducer.
-   `status` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** one of `finding`, `findingOne`, `creating`, `updating` or `deleting`.
-   `key` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** (optional) - the key of the entity (the value returned by the specified `idPath`).

Returns **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** `true` if the request is pending, else `false`.

## handlerCreator

Creates the handler function to handle the REST request actions (request, success, fail).

**Parameters**

-   `verb` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The verb to handle (find, findOne, create, update or delete).
-   `requestActions` **RequestActions** An object containing the request, success and fail action creators to handle.
-   `idPath` **IdPath** The path to the value to identify the REST entities (string, string array, function or string with dot separation).

Returns **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** An object containing the functions to handle request, success and fail state change in the reducer.

## restReducer

Creates a REST reducer to handle the defined actions.

**Parameters**

-   `config` **[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The REST reducer config with the following keys: `idPath`, the path to the identifier of the requested objects (string, array of string or function); `actions`: the REST actions to handle; `extraHandlers`: an object where each key is the action type to handle and each key contains a function to handle the state change for these actions.

Returns **Reducer** A reducer to handle REST requests state changes.