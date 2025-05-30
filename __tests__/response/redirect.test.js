'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')
const context = require('../../test-helpers/context')
const Koa = require('../..')

describe('ctx.redirect(url)', () => {
  it('should redirect to the given url', () => {
    const ctx = context()
    ctx.redirect('http://google.com')
    assert.strictEqual(ctx.response.header.location, 'http://google.com/')
    assert.strictEqual(ctx.status, 302)
  })

  it('should formatting url before redirect', () => {
    const ctx = context()
    ctx.redirect('http://google.com\\@apple.com')
    assert.strictEqual(ctx.response.header.location, 'http://google.com/@apple.com')
    assert.strictEqual(ctx.status, 302)
  })

  it('should formatting url before redirect', () => {
    const ctx = context()
    ctx.redirect('HTTP://google.com\\@apple.com')
    assert.strictEqual(ctx.response.header.location, 'http://google.com/@apple.com')
    assert.strictEqual(ctx.status, 302)
  })

  it('should auto fix not encode url', async () => {
    const app = new Koa()

    app.use(ctx => {
      ctx.redirect('http://google.com/😓')
    })

    const res = await request(app.callback())
      .get('/')

    assert.strictEqual(res.status, 302)
    assert.strictEqual(res.headers.location, 'http://google.com/%F0%9F%98%93')
  })

  describe('when html is accepted', () => {
    it('should respond with html', () => {
      const ctx = context()
      const url = 'http://google.com/'
      ctx.header.accept = 'text/html'
      ctx.redirect(url)
      assert.strictEqual(ctx.response.header['content-type'], 'text/html; charset=utf-8')
      assert.strictEqual(ctx.body, `Redirecting to ${url}.`)
    })

    it('should escape the url', () => {
      const ctx = context()
      let url = '<script>'
      ctx.header.accept = 'text/html'
      ctx.redirect(url)
      url = escape(url)
      assert.strictEqual(ctx.response.header['content-type'], 'text/html; charset=utf-8')
      assert.strictEqual(ctx.body, `Redirecting to ${url}.`)
    })
  })

  describe('when text is accepted', () => {
    it('should respond with text', () => {
      const ctx = context()
      const url = 'http://google.com'
      ctx.header.accept = 'text/plain'
      ctx.redirect(url)
      assert.strictEqual(ctx.body, `Redirecting to ${url}/.`)
    })
  })

  describe('when status is 301', () => {
    it('should not change the status code', () => {
      const ctx = context()
      const url = 'http://google.com'
      ctx.status = 301
      ctx.header.accept = 'text/plain'
      ctx.redirect('http://google.com')
      assert.strictEqual(ctx.status, 301)
      assert.strictEqual(ctx.body, `Redirecting to ${url}/.`)
    })
  })

  describe('when status is 304', () => {
    it('should change the status code', () => {
      const ctx = context()
      const url = 'http://google.com'
      ctx.status = 304
      ctx.header.accept = 'text/plain'
      ctx.redirect('http://google.com')
      assert.strictEqual(ctx.status, 302)
      assert.strictEqual(ctx.body, `Redirecting to ${url}/.`)
    })
  })

  describe('when content-type was present', () => {
    it('should overwrite content-type', () => {
      const ctx = context()
      ctx.body = {}
      const url = 'http://google.com'
      ctx.header.accept = 'text/plain'
      ctx.redirect('http://google.com')
      assert.strictEqual(ctx.status, 302)
      assert.strictEqual(ctx.body, `Redirecting to ${url}/.`)
      assert.strictEqual(ctx.type, 'text/plain')
    })
  })
})

function escape (html) {
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
