import dotenv from "dotenv";
import { UserSession } from "./types";
import { handleAddTwitter, handleStart } from "./handlers/message";
import pool from "./lib/db/db";
import telegram from "./lib/telegram";
import {
  changeTwitter,
  completeVerification,
  connectTwitter,
  verifyTwitter,
} from "./handlers/callbacks";

dotenv.config();

telegram.updates.on("message", async (context) => {
  const res = await pool.query(
    `
    SELECT status FROM sessions
    WHERE user_id = $1
  `,
    [context.from!.id]
  );

  const session = res.rows[0] as UserSession | undefined;

  if (context.text?.toLowerCase() === "/start") {
    await handleStart(context, session);
  }

  if (session?.status === "AWAITING_TWITTER") {
    await handleAddTwitter(context, session);
  }
});

telegram.updates.on("callback_query", async (context) => {
  const data = JSON.parse(context.data!);

  if (data.callback_data === "connect_twitter") {
    connectTwitter(context);
    return;
  }

  if (data.callback_data === "verify_account") {
    verifyTwitter(context, data.user);
    return;
  }

  if (data.callback_data === "change_twitter") {
    changeTwitter(context);
    return;
  }

  if (data.callback_data === "complete_verification") {
    completeVerification(context);
    return;
  }

  console.log("Callback query received:", context.data);
});

telegram.updates.startPolling();
