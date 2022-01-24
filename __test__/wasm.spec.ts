import { Buffer } from 'buffer'
import { promises as fs } from 'fs'
import { join } from 'path'

import test from 'ava'
import jimp from 'jimp'

import { Buffer } from 'buffer'
import { render } from '../wasm-node'

test('fit to width', async (t) => {
  const filePath = '../example/text.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const opts = {
    background: '#eeebe6',
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  }
  let pngData = render(svgString, JSON.stringify(opts))
  const pngData = render(svgString, JSON.stringify(opts))
  const result = await jimp.read(Buffer.from(pngData))

  t.is(result.getWidth(), 1200)
  t.is(result.getHeight(), 623)
})

test('Set the background with alpha by rgba().', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const opts = {
    background: 'rgba(0, 0, 0, 0.6)',
  }
  const pngData = render(svgString, JSON.stringify(opts))
  const result = await jimp.read(Buffer.from(pngData))

  t.is(result.hasAlpha(), true)
})

test('Set the background with alpha by rgb().', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const opts = {
    background: 'rgb(255, 0, 0, .832)',
  }
  const pngData = render(svgString, JSON.stringify(opts))
  const result = await jimp.read(Buffer.from(pngData))

  t.is(result.hasAlpha(), true)
})

test('Set the background without alpha by hsla()', async (t) => {
  const filePath = './tiger.svg'
  const svg = await fs.readFile(join(__dirname, filePath))
  const svgString = svg.toString('utf-8')
  const opts = {
    background: 'hsla(255, 80%, 50%, 1)',
  }
  const pngData = render(svgString, JSON.stringify(opts))
  const result = await jimp.read(Buffer.from(pngData))

  t.is(result.hasAlpha(), false)
})
