'use strict'
let Transform = require('readable-stream/transform')
  , deepExtend = require('deep-extend')
  , outils = require('./outils')


class ObjectPipeline extends Transform {

  constructor (options) {
    super(options)

    this.operations = []
  }

  _transform (object, enc, callback) {

    let ret = deepExtend(object)
    for ( let operation of this.operations ) {
      ret = _process(ret, operation)
    }
    callback(null, ret)
  }

  map () {
    let mappers = []
    for ( let i in arguments ) {
      if ( !outils.Type.isFunction(arguments[i]) ) {
        throw new TypeError('Argument of map() must be Function')
      }
      mappers.push(arguments[i])
    }
    mappers.type = 'map'

    this.operations.push(mappers)
    return this
  }

  filter () {

    let filters = []
    for ( let i in arguments ) {
      if ( !outils.Type.isArray(arguments[i]) && !outils.Type.isFunction(arguments[i]) ) {
        throw new TypeError('Arguments of filter() must be Array or Function')
      }
      filters.push(arguments[i])
    }
    filters.type = 'filter'

    this.operations.push(filters)
    return this
  }
}

function _process (source, operation) {
  let node = createNode(null, source, null)

  if ( operation.type == 'map' ) {
    _transform(node, operation)
    return source
  }

  if ( operation.type == 'filter' ) {

    let paths = []
      , jsonPaths = []
      , predicates = []

    for ( let i = 0; i < operation.length; i++ ) {
      if ( outils.Type.isArray(operation[i]) ) {
        paths.push(operation.splice(i, 1)[0])
      } else if ( outils.Type.isString(operation[i]) ) {
        jsonPaths.push(operation.splice(i, 1)[0])
      } else if ( outils.Type.isFunction(operation[i]) ) {
        predicates.push(operation.splice(i, 1)[0])
      }
    }

    let ret = outils.Type.isArray(source) ? [] : {}

    for ( let path of paths ) {
      let value = outils.Objects.getValueByPath(source, path)
      ret = deepExtend(ret, outils.Objects.createObjectByPath(value, path))
    }

    //for ( let jsonPath of jsonPaths ) {
    //  ret = deepExtend(ret, getByJsonPath(source, jsonPath))
    //}

    ret = deepExtend(ret, _pick(node, predicates))

    return ret
  }

  throw new Error('should not be here')
}

function _pick (node, predicates) {

  if ( predicates.length <= 0 )return node.value

  let picked = false
  for ( let predicate of predicates ) {
    if ( predicate(node) ) {
      picked = true
      break
    }
  }
  if ( picked ) {
    node.isPicked = true
    return node.value
  }

  if ( node.isLeaf ) {
    node.isPicked = false
    return undefined
  }

  // handle children
  let childPicked = false
  let newValue
  if ( node.isObject ) {
    newValue = {}
    for ( let key in node.value ) {
      let childNode = createNode(key, node.value[key], node)
      let ret = _pick(childNode, predicates)
      if ( childNode.isPicked ) {
        childPicked = true
        newValue[key] = ret
      }
    }
  } else if ( node.isArray ) {
    newValue = []
    for ( let key in node.value ) {
      let childNode = createNode(key, node.value[key], node)
      let ret = _pick(childNode, predicates)
      if ( childNode.isPicked ) {
        childPicked = true
        newValue.push(ret)
      }
    }
  } else {
    node.isPicked = false
    return undefined
  }
  node.isPicked = childPicked
  return childPicked ? newValue : undefined
}

function _transform (node, transforms) {

  for ( let transform of transforms ) {
    transform(node)
  }

  if ( !node.walkChildren ) return

  if ( !node.isLeaf ) {
    for ( let key in node.value ) {
      _transform(createNode(key, node.value[key], node), transforms)
    }
  }
}

function createNode (key, value, parent) {
  let node = {
    parent: parent,
    key: key,
    value: value,
    path: parent ? parent.path.concat(key) : [],
    parentNodes: parent ? parent.parentNodes.concat(parent) : [],
    circular: null,
    walkChildren: true,
    type: typeof value,
    isRoot: parent == null || parent == undefined,
    isLeaf: !outils.Type.isObject(value) && !outils.Type.isArray(value),
    isObject: outils.Type.isObject(value),
    isArray: outils.Type.isArray(value),
    isParentObject: parent ? outils.Type.isObject(parent.value) : false,
    isParentArray: parent ? outils.Type.isArray(parent.value) : false

  }
  node.depth = node.path.length

  if ( !node.isLeaf ) {
    for ( let item of node.parentNodes ) {
      if ( item.value == value ) {
        node.circular = item
        break
      }
    }
  }

  node.updateValue = (value) => {
    if ( node.parent )
      node.parent.value[node.key] = value
    return node
  }

  node.remove = ()=> {
    if ( node.isParentArray ) { // remove element from array
      node.parent.value.splice(node.key, 1)
    } else { // remove property from object
      delete node.parent.value[node.key]
    }
    return node
  }

  node.back = ()=> {
    node.walkChildren = false;
    return node
  }

  return node
}


module.exports = (options)=> {

  options = Object.assign(options || {}, { objectMode: true })
  return new ObjectPipeline(options)
}