import { Telegram } from 'puregram'
import dotenv from 'dotenv'

dotenv.config()

const telegram = Telegram.fromToken(process.env['BOT_TOKEN']!, {
  apiTimeout: 30_000,
})

export default telegram
