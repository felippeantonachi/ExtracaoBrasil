import { Router } from 'express'

const defineRotas = () => {
  const router = Router()
  router.get('/', (req, res) => (res.sendStatus(200)))
  return router
}

export {
  defineRotas
}