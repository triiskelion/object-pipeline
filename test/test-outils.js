'use strict'

let expect = require('chai').expect

let outils = require('../lib/outils')

describe('Objects', function () {

  describe('createObjectByPath', function () {
    it('should create object by path', function () {
      let ret = outils.Objects.createObjectByPath(1, ['200', 'b'])
      expect(ret).to.deep.equals({ 200: { b: 1 } })
    })
    it('should create array by path', function () {
      let ret = outils.Objects.createObjectByPath(1, [1, 'b'])
      expect(ret).to.be.an('array')
      expect(ret[0]).to.be.an('undefined')
      expect(ret[1]).to.deep.equals({ b: 1 })
    })
  })
})









