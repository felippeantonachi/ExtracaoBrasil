import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { iniciaProcessoArquivo } from "./src/brasil"
import { defineRotas } from './src/rotas'

const app = express()
app.use(cors())
app.use(express.json())
app.use(defineRotas())
const port = process.env.PORT || 8082

async function start () {
  try {
    app.listen(port, () => {
      console.log(`Extração Brasil rodando na porta ${port}`)
      iniciaProcessoArquivo()
    })
  } catch (error) {
    console.error(error) 
  }
}

start()