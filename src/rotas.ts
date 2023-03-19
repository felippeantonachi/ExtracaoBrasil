import { Router } from 'express'
import { conectar, desconectar, listar, buscar } from './db'

const defineRotas = () => {
  const router = Router()

  router.get('/', (req, res) => (res.sendStatus(200)))
  router.get('/listar', async (req, res) => {
    try {
      const conexao = await conectar()
      try {
        const processos = await listar(conexao)
        res.send(processos).status(200)
      } catch (error) {
        res.send(error).status(500)
      } finally {
        await  desconectar(conexao)
      }
    } catch (error) {
      res.send(error).status(500)
    }
  })
  router.get('/buscar', async (req, res) => {
    try {
      const conexao = await conectar()
      try {
        const processos = await buscar(conexao, req.query.numeroProcesso)
        res.send(processos).status(200)
      } catch (error) {
        res.send(error).status(500)
      } finally {
        await  desconectar(conexao)
      }
    } catch (error) {
      res.send(error).status(500)
    }
  })

  return router
}

export {
  defineRotas
}