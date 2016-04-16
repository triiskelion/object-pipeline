'use strict'

let toString = (obj)=> { return Object.prototype.toString.call(obj) }
module.exports = {

  Type: {

    of: (value) => {return toString(value)},
    isObject: (value) => { return toString(value) === '[object Object]' },
    isArray: (value) => {
      return Array.isArray ? Array.isArray(value)
        : toString(value) === '[object Array]'
    },
    isFunction: (value) => { return toString(value) === '[object Function]' },
    isNull: (value) => { return toString(value) === '[object Null]' },
    isUndefined: (value) => { return toString(value) === '[object Undefined]' },
    isDate(obj) { return toString(obj) === '[object Date]' },
    isRegExp(obj) { return toString(obj) === '[object RegExp]' },
    isError(obj) { return toString(obj) === '[object Error]' },
    isBoolean(obj) { return toString(obj) === '[object Boolean]' },
    isNumber(obj) { return toString(obj) === '[object Number]' },
    isString(obj) { return toString(obj) === '[object String]' }
  },

  Objects: {

    copy: (source) => {
      if ( Type.isObject(source) ) {
        return Object.assign({}, source)
      } else if ( Type.isArray(source) ) {

        let ret = []
        for ( i of source ) {
          ret.push(Objects.copy(source))
        }
        return ret

      } else return source
    }
  },
  Arrays: {}
}
