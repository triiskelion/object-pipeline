'use strict'
let JSONPath = require('JSONPath')
let ret = JSONPath({
  json: { a: 1, b: { b1: 1, b2: "hi" }, c: "hehe" },
  path: "$.b",
  resultType: "all",
  flatten: false
})

console.log(ret)