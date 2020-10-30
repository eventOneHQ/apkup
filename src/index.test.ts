import { Apkup } from './index'

test('initialize apkup successfully when all required params are passed', async () => {
  const apkup = new Apkup({
    client_email: 'email@example.com',
    private_key: 'test'
  })
})

test('fail initialization when no client_email is passed', async () => {
  expect.assertions(1)
  try {
    const apkup = new Apkup({
      client_email: '',
      private_key: 'test'
    })
  } catch (err) {
    expect(err.message).toMatch('Missing required parameter client_email')
  }
})

test('fail initialization when no private_key is passed', async () => {
  expect.assertions(1)
  try {
    const apkup = new Apkup({
      client_email: 'email@example.com',
      private_key: ''
    })
  } catch (err) {
    expect(err.message).toMatch('Missing required parameter private_key')
  }
})
