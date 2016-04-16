'use strict'

let expect = require('chai').expect

let ObjectPipeline = require('../index')

describe('map()', function () {
  it('should map object', function () {

    let pipeline = ObjectPipeline().map(
      (node)=> {
        if ( node.type == 'number' ) {
          node.updateValue(node.value + 1)
        }
      },
      (node)=> {
        if ( node.type == 'string' ) {
          node.updateValue('')
        }
      }
    )
    pipeline.write({
        a: 1,
        b: "someString",
        c: [1, 2, 3],
        d: {
          d1: 1,
          d2: "someString",
          d3: [1, 2, 3],
          d4: {
            d41: 1,
            d42: 2
          }
        }
      }
    )
    pipeline.on('data', (data)=> {
      expect(data).to.deep.equal({
        a: 2,
        b: "",
        c: [2, 3, 4],
        d: {
          d1: 2,
          d2: "",
          d3: [2, 3, 4],
          d4: {
            d41: 2,
            d42: 3
          }
        }
      })
    })

  })
  it('should map array', function () {

    let pipeline = ObjectPipeline().map(
      (node)=> {
        if ( typeof node.value == 'number' ) {
          node.updateValue(node.value + 1)
        }
      },
      (node)=> {
        if ( typeof node.value == 'string' ) {
          node.updateValue('')
        }
      }
    )
    pipeline.write(
      [{ a: 1, b: "something" }, { a: 1, b: "something" }, { a: 1, b: "something" }]
    )
    pipeline.on('data', (data)=> {
      expect(data).to.deep.equal(
        [{ a: 2, b: "" }, { a: 2, b: "" }, { a: 2, b: "" }]
      )
    })

  })
})

describe('filter()', function () {

  it('should filter object by path', function () {

    let pipeline = ObjectPipeline().filter(['propC', 'propE', 'yes'])
    pipeline.write(
      { propA: 1, propB: "", propC: { propD: "wrong", propE: { yes: "yes", no: "no" } } }
    )
    pipeline.on('data', (data)=> {
      expect(data).to.deep.equal({
        propC: {
          propE: {
            yes: "yes"
          }
        }
      })
    })
  })
  it('should filter object by predicates', function () {

    let pipeline = ObjectPipeline().filter(
      (node)=> {
        return node.type == 'number'
      }
    )
    pipeline.write({
      a: 1,
      b: "hello",
      c: [1, 2, 3],
      d: {
        some: true,
        d1: 1,
        notGood: "no"
      }
    })
    pipeline.on('data', (data)=> {
      expect(data).to.deep.equal(
        {
          a: 1,
          c: [1, 2, 3],
          d: {
            d1: 1
          }
        }
      )
    })

  })
  it('should filter array by path', function () {

    let pipeline = ObjectPipeline().filter([1, "propA"])
    pipeline.write(
      [{ propA: 1, propB: "hello" }, { propA: 2, propB: "bonjour" }, { propA: 3, propB: "olla" }]
    )
    pipeline.on('data', (data)=> {
      expect(data).to.deep.equal(
        [{ propA: 1 }]
      )
    })
  })
  it('should filter array by predicates', function () {

    let pipeline = ObjectPipeline().filter(
      (node)=> {
        return node.type == 'number'
      }
    )
    pipeline.write(
      [{ propA: 1, propB: "hello" }, { propA: 2, propB: "bonjour" }, { propA: 3, propB: "olla" }]
    )
    pipeline.on('data', (data)=> {
      expect(data).to.deep.equal(
        [{ propA: 1 }, { propA: 2 }, { propA: 3 }]
      )
    })

  })
})

describe('writeSync', function () {
  it('should transform object synchronously', function () {

    let pipeline = ObjectPipeline()
      .map((node)=> {
        if ( node.key == 'yes' ) {
          node.updateValue('oui')
        }
      })
      .filter(['propC', 'propE', 'yes'])

    let ret = pipeline.writeSync(
      { propA: 1, propB: "", propC: { propD: "wrong", propE: { yes: "yes", no: "no" } } }
    )
    expect(ret).to.deep.equal(
      {
        propC: {
          propE: {
            yes: "oui"
          }
        }
      }
    )
  })
})









