import { Router } from 'express'
import { conectar, desconectar, listar, buscar, filtrar } from './db'

const defineRotas = () => {
  const router = Router()

  router.get('/', (req, res) => (res.status(200).send('Extração Brasil')))
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
        const numeroProcesso = req.query.numeroProcesso as string
        const processo = await buscar(conexao, numeroProcesso)
        res.send(processo).status(200)
      } catch (error) {
        res.send(error).status(500)
      } finally {
        await  desconectar(conexao)
      }
    } catch (error) {
      res.send(error).status(500)
    }
  })
  router.get('/filtrar', async (req, res) => {
    try {
      const conexao = await conectar()
      try {
        const filtro = req.query.filtro
        const processos = await filtrar(conexao, filtro as string)
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