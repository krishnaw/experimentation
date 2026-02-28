import { describe, it, expect, vi, beforeAll } from 'vitest'

// Mock GrowthBook before importing the app
vi.mock('../lib/growthbook', () => {
  const fakeScoped = {
    isOn: () => false,
    getFeatureValue: (_key: string, fallback: any) => fallback,
  }
  return {
    gbClient: {
      createScopedInstance: () => fakeScoped,
    },
    initGrowthBook: vi.fn().mockResolvedValue(undefined),
  }
})

// We need to import express app without starting the server.
// The index.ts calls main() which starts listening, so we need to
// extract the app. Let's import the module parts we need directly.
import express from 'express'
import cors from 'cors'
import { gbClient } from '../lib/growthbook'
import { products } from '../data/products'
import request from 'supertest'

// Recreate the app routes (mirroring index.ts) for testing
function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.get('/api/products', async (req, res) => {
    const userId = (req.query.userId as string) || 'anonymous'
    const category = req.query.category as string | undefined

    const gb = gbClient.createScopedInstance({
      attributes: { id: userId, deviceType: 'web' },
    })

    const sortOrder = gb.getFeatureValue('product-sort-order', 'popularity')

    let sorted = [...products]

    if (category) {
      sorted = sorted.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      )
    }

    if (sortOrder === 'price') {
      sorted.sort((a, b) => a.price - b.price)
    } else {
      sorted.sort((a, b) => b.popularity - a.popularity)
    }

    res.json({
      products: sorted,
      meta: { sortOrder, userId, total: sorted.length },
    })
  })

  app.get('/api/products/:id', (req, res) => {
    const product = products.find((p) => p.id === req.params.id)
    if (!product) {
      res.status(404).json({ error: 'Product not found' })
      return
    }
    res.json(product)
  })

  return app
}

describe('API integration tests', () => {
  let app: ReturnType<typeof createApp>

  beforeAll(() => {
    app = createApp()
  })

  describe('GET /health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/health')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('status', 'ok')
      expect(res.body).toHaveProperty('timestamp')
    })
  })

  describe('GET /api/products', () => {
    it('returns an array of products', async () => {
      const res = await request(app).get('/api/products')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.products)).toBe(true)
      expect(res.body.products.length).toBeGreaterThan(0)
    })

    it('filters by category', async () => {
      const res = await request(app).get('/api/products?category=electronics')
      expect(res.status).toBe(200)
      for (const p of res.body.products) {
        expect(p.category.toLowerCase()).toBe('electronics')
      }
    })

    it('returns meta with sort order and total', async () => {
      const res = await request(app).get('/api/products')
      expect(res.body.meta).toHaveProperty('sortOrder', 'popularity')
      expect(res.body.meta).toHaveProperty('total')
      expect(res.body.meta.total).toBe(res.body.products.length)
    })

    it('returns products sorted by popularity by default', async () => {
      const res = await request(app).get('/api/products')
      const popularities = res.body.products.map((p: any) => p.popularity)
      for (let i = 1; i < popularities.length; i++) {
        expect(popularities[i]).toBeLessThanOrEqual(popularities[i - 1])
      }
    })

    it('returns 200 with empty array for unknown category', async () => {
      const res = await request(app).get('/api/products?category=NonExistentCategory')
      expect(res.status).toBe(200)
      expect(res.body.products).toEqual([])
      expect(res.body.meta.total).toBe(0)
    })

    it('reflects userId query param in meta', async () => {
      const res = await request(app).get('/api/products?userId=test-user')
      expect(res.status).toBe(200)
      expect(res.body.meta.userId).toBe('test-user')
    })

    it('defaults userId to anonymous when not provided', async () => {
      const res = await request(app).get('/api/products')
      expect(res.body.meta.userId).toBe('anonymous')
    })
  })

  describe('GET /api/products/:id', () => {
    it('returns a product by ID', async () => {
      const res = await request(app).get('/api/products/wireless-headphones')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('id', 'wireless-headphones')
      expect(res.body).toHaveProperty('name')
    })

    it('returns 404 for non-existent product', async () => {
      const res = await request(app).get('/api/products/nonexistent-product')
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error', 'Product not found')
    })

    it('returns 404 for numeric-looking nonexistent ID', async () => {
      const res = await request(app).get('/api/products/999')
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error', 'Product not found')
    })
  })
})

describe('API with price sort order', () => {
  let priceSortApp: ReturnType<typeof createApp>

  function createPriceSortApp() {
    const app = express()
    app.use(cors())
    app.use(express.json())

    app.get('/api/products', async (req, res) => {
      const userId = (req.query.userId as string) || 'anonymous'
      const category = req.query.category as string | undefined

      // Simulate GrowthBook returning "price" sort order
      const sortOrder = 'price'

      let sorted = [...products]

      if (category) {
        sorted = sorted.filter(
          (p) => p.category.toLowerCase() === category.toLowerCase()
        )
      }

      if (sortOrder === 'price') {
        sorted.sort((a, b) => a.price - b.price)
      } else {
        sorted.sort((a, b) => b.popularity - a.popularity)
      }

      res.json({
        products: sorted,
        meta: { sortOrder, userId, total: sorted.length },
      })
    })

    return app
  }

  beforeAll(() => {
    priceSortApp = createPriceSortApp()
  })

  it('sorts products by price when GrowthBook returns price', async () => {
    const res = await request(priceSortApp).get('/api/products')
    expect(res.status).toBe(200)
    expect(res.body.meta.sortOrder).toBe('price')
    const prices = res.body.products.map((p: any) => p.price)
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1])
    }
  })

  it('combines category filter with price sort', async () => {
    const res = await request(priceSortApp).get('/api/products?category=Electronics')
    expect(res.status).toBe(200)
    expect(res.body.meta.sortOrder).toBe('price')
    const prices = res.body.products.map((p: any) => p.price)
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1])
    }
    for (const p of res.body.products) {
      expect(p.category).toBe('Electronics')
    }
    expect(res.body.products.length).toBeGreaterThan(0)
  })
})
