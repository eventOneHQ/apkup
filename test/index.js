var test = require('tape')

test('asks for options', function (t) {
  var Publisher = require('../lib')
  t.throws(function () {
    Publisher()
  })
  t.throws(function () {
    Publisher({client_email: 'foo'})
  })
  t.throws(function () {
    Publisher({private_key: 'foo'})
  })
  t.doesNotThrow(function () {
    Publisher({client_email: 'foo', private_key: 'bar'})
  })
  t.end()
})
