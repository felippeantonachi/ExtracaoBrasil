export class Processo {
  PROCESSO: string
  NUMERO: string
  ANO: string
  AREA_HA: string
  ID: string
  FASE: string
  ULT_EVENTO: string
  DATA_ULT_EVENTO: string
  NOME: string
  SUBS: string
  USO: string
  UF: string
  DSProcesso: string

  constructor (processo: Processo) {
    this.PROCESSO = processo.PROCESSO
    this.NUMERO = processo.NUMERO
    this.ANO = processo.ANO
    this.AREA_HA = processo.AREA_HA
    this.ID = processo.ID
    this.FASE = processo.FASE
    this.ULT_EVENTO = processo.ULT_EVENTO
    this.DATA_ULT_EVENTO = processo.DATA_ULT_EVENTO
    this.NOME = processo.NOME
    this.SUBS = processo.SUBS
    this.USO = processo.USO
    this.UF = processo.UF
    this.DSProcesso = processo.DSProcesso
  }
}