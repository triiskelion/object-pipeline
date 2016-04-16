'use strict'
let Transform = require('readable-stream/transform')
  , deepExtend = require('deep-extend')
  , Type = require('./commons').Type


class ObjectPipeline extends Transform {

  constructor (options) {
    super(options)

    this.tasks = []
  }

  _transform (object, enc, callback) {

    let ret = deepExtend(object)
    for ( let group of this.tasks ) {
      ret = _process(ret, group)
    }
    callback(null, ret)
  }


  map () {
    let group = []
    for ( let i in arguments ) {
      if ( !Type.isFunction(arguments[i]) ) {
        throw new Error('map() argument must be Function')
      }
      group.push(arguments[i])
    }
    group.type = 'map'

    this.tasks.push(group)
    return this
  }


  filter () {

    let group = []
    for ( let i in arguments ) {
      if ( !Type.isArray(arguments[i]) && !Type.isFunction(arguments[i]) ) {
        throw new Error('filter() arguments must be Array or Function')
      }
      group.push(arguments[i])
    }
    group.type = 'filter'

    this.tasks.push(group)
    return this
  }
}

function _process (rootNode, tasks) {
  let ctx = createContext(null, rootNode, null)

  if ( tasks.type == 'map' ) {
    _visit(rootNode, ctx, tasks)
    return rootNode
  }

  if ( tasks.type == 'filter' ) {

    let paths = []
    let jsonPaths = []
    for ( let i = 0; i < tasks.length; i++ ) {
      if ( Type.isArray(tasks[i]) ) {
        paths.push(tasks.splice(i, 1)[0])
      } else if ( Type.isString(tasks[i]) ) {
        jsonPaths.push(tasks.splice(i, 1)[0])
      }
    }

    let ret = Type.isArray(rootNode) ? [] : {}

    for ( let path of paths ) {
      ret = deepExtend(ret, createObjectByPath(rootNode, path))
    }

    for ( let jsonPath of jsonPaths ) {
      ret = deepExtend(ret, getByJsonPath(rootNode, jsonPath))
    }

    if ( tasks.length > 0 ) {
      ret = deepExtend(ret, _pick(rootNode, ctx, tasks))
    }

    return ret

  } else {
    throw new Error('should not be here')
  }
}

function _pick (value, ctx, predicates) {
  if ( predicates.length <= 0 )return value
  let picked = false
  for ( let predicate of predicates ) {
    if ( predicate(value, ctx) ) {
      picked = true
      break
    }
  }
  if ( picked ) {
    ctx.isPicked = true
    return value
  }

  if ( ctx.isLeafNode ) {
    ctx.isPicked = false
    return undefined
  }

  // handle children
  let childPicked = false
  let newValue
  if ( Type.isObject(value) ) {
    newValue = {}
    for ( let key in value ) {
      let childCtx = createContext(key, value[key], ctx)
      let ret = _pick(value[key], childCtx, predicates)
      if ( childCtx.isPicked ) {
        childPicked = true
        newValue[key] = ret
      }
    }
  } else if ( Type.isArray(value) ) {
    newValue = []
    for ( let key in value ) {
      let childCtx = createContext(key, value[key], ctx)
      let ret = _pick(value[key], childCtx, predicates)
      if ( childCtx.isPicked ) {
        childPicked = true
        newValue.push(ret)
      }
    }
  } else {
    ctx.isPicked = false
    return undefined
  }
  ctx.isPicked = childPicked
  return childPicked ? newValue : undefined

}

function _visit (value, ctx, transforms) {

  for ( let transform of transforms ) {
    transform(value, ctx)
  }

  if ( !ctx.walkChildren ) return

  if ( Type.isObject(value) || Type.isArray(value) ) {
    for ( let key in value ) {
      _visit(value[key], createContext(key, value[key], ctx), transforms)
    }
  }
}

function createContext (key, value, parent) {
  let ctx = {
    parent: parent,
    key: key,
    value: value,
    path: parent ? parent.path.concat(key) : [],
    parentCtx: parent ? parent.parentCtx.concat(parent) : [],
    isRootNode: parent == null || parent == undefined,
    isLeafNode: !Type.isObject(value) && !Type.isArray(value),
    circular: null,
    walkChildren: true,
    isParentArray: parent ? Type.isArray(parent.value) : false,
    isParentObject: parent ? Type.isObject(parent.value) : false
  }
  ctx.depth = ctx.path.length

  if ( !ctx.isLeafNode ) {
    for ( let item of ctx.parentCtx ) {
      if ( item.value == value ) {
        ctx.circular = item
        break
      }
    }
  }
  ctx.update = (value) => {
    if ( ctx.parent )
      ctx.parent.value[ctx.key] = value
    return ctx
  }
  ctx.remove = ()=> {
    if ( Type.isString(ctx.key) ) {
      ctx.delete()
    } else if ( Type.isNumber(ctx.key) ) {
      ctx.parent.value.splice(ctx.key, 1)
    }
  }
  ctx.delete = ()=> {
    delete ctx.parent.value[ctx.key]
    return ctx
  }
  ctx.back = ()=> { ctx.walkChildren = false}
  return ctx
}

let createObjectByPath = (src, path)=> {
  return _createByPath(path, getValueByPath(src, path))
}

let _createByPath = (path, value)=> {

  let key = path.shift()

  let child = path.length == 0 ? value : _createByPath(path, value)
  if ( Type.isNumber(key) ) {
    return [child]
  } else {
    return { [key]: child }
  }
}

let getValueByPath = (obj, path) => {
  let node = obj
  for ( let key of path ) {
    if ( !node || !hasOwnProperty.call(node, key) ) { return undefined }
    node = node[key]
  }
  return node
}

let getByJsonPath = (obj, path) => {
  JSONPath({ json: obj, path: path, callback: callback });
}

module.exports = (options)=> {

  options = deepExtend(options || {}, { objectMode: true })
  let pipeline = new ObjectPipeline(options)

  // pipeline._transform = transform
  // if ( flush )
  //   pipeline._flush = flush
  return pipeline
}