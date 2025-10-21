import { Telegram } from "puregram";

const telegram = Telegram.fromToken(process.env["BOT_TOKEN"]!);

export default telegram;
