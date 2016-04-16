'use strict'

function typeOf (obj) { return Object.prototype.toString.call(obj) }

module.exports = {

  Type: {

    of: (value) => {return typeOf(value)},
    isObject: (value) => { return typeOf(value) === '[object Object]' },
    isPlainObject: (value) => { return typeOf(value) === '[object Object]' },
    isArray: (value) => {
      return Array.isArray ? Array.isArray(value)
        : typeOf(value) === '[object Array]'
    },
    isFunction: (value) => { return typeOf(value) === '[object Function]' },
    isNull: (value) => { return typeOf(value) === '[object Null]' },
    isUndefined: (value) => { return typeOf(value) === '[object Undefined]' },
    isDate(obj) { return typeOf(obj) === '[object Date]' },
    isRegExp(obj) { return typeOf(obj) === '[object RegExp]' },
    isError(obj) { return typeOf(obj) === '[object Error]' },
    isBoolean(obj) { return typeOf(obj) === '[object Boolean]' },
    isNumber(obj) { return typeOf(obj) === '[object Number]' },
    isString(obj) { return typeOf(obj) === '[object String]' }
  },

  Random: {

    randomNum: function (digits) {
      return Math.floor(Math.random() * Math.pow(10, digits))
    },
    randomNumRange: function (min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min)
    }
  },

  Objects: {

    copy: (source) => {
      if ( this.Type.isObject(source) ) {
        return Object.assign({}, source)
      } else if ( this.Type.isArray(source) ) {

        let ret = []
        for (let item of source ) {
          ret.push(this.Objects.copy(item))
        }
        return ret

      } else return source
    },

    /**
     * Return true if obj equals to any of the item in the array
     * @param obj
     * @param {array}array
     * @returns {boolean}
     */
    equalsAny: function (obj, array) {
      for ( let item of array ) {
        if ( obj == item ) return true
      }
      return false
    },

    setValue: function (obj, path, value, override) {

      if ( !Array.isArray(path) || path.length == 0 )return obj

      if ( path.length == 1 ) {

        obj[path[0]] = value

      } else {

        let key = path.shift()

        if ( obj[key] == null || obj[key] == undefined ) {
          obj[key] = this.setValue(typeof path[0] === 'number' ? [] : {}, path, value)
        } else if ( typeof obj[key] !== 'object' ) {
          if ( override ) {
            obj[key] = this.setValue(typeof path[0] === 'number' ? [] : {}, path, value)
          }
        } else { // object
          obj[key] = this.setValue(obj[key] || (typeof path[0] === 'number' ? [] : {}), path, value)
        }
      }
      return obj
    }

  },

  Arrays: {

    equals: function (arr1, arr2) {
      if ( !Array.isArray(arr1) || !Array.isArray(arr2) ) return false
      if ( arr1.length != arr2.length ) return false
      for ( let i = 0; i < arr1.length; i++ ) {
        if ( arr1[i] != arr2[i] ) return false
      }
      return true
    }

  },

  Conditions: {

    all: function () {

      for ( let c of arguments ) {
        if ( !c ) return false
      }
      return true
    },

    any: function () {

      for ( let c of arguments ) {
        if ( c ) return true
      }
      return false
    }

  }
}