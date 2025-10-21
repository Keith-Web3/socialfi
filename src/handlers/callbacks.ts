import { CallbackQueryContext, InlineKeyboard } from "puregram";
import pool from "../lib/db/db";
import telegram from "../lib/telegram";
import crypto from "crypto";
import {
  add_campaign,
  change_twitter,
  check_points,
  confirm_verification,
  connect_twitter,
  my_campaigns,
  verify_account,
  view_active_campaigns,
} from "../utils/keyboard";
import { Tweet, UserSession } from "../types";

export const connectTwitter = async function (context: CallbackQueryContext) {
  try {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: "✍️ Please enter your Twitter username (e.g. @defigenie or defigenie).",
    });

    await pool.query(
      `
          UPDATE sessions
          SET status = $1, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $2
        `,
      ["AWAITING_TWITTER", context.from!.id]
    );
  } catch (error) {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Please try again later.`,
    });

    console.error("Error in handleConnectTwitter:", error);
  }
};

export const verifyTwitter = async function (
  context: CallbackQueryContext,
  user: UserSession
) {
  try {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();

    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `🧩 To verify your Twitter account, follow these steps:\n\n1. Post a tweet from @${user.twitter_username} containing this code: #Engage${user.verification_code}\n2. After posting, return here and tap "✅ Complete Verification"\n\nIf you made a mistake or want to use a different account, you can change your Twitter username.`,
      reply_markup: InlineKeyboard.keyboard([
        [confirm_verification({ user })],
        [change_twitter({ user })],
      ]),
    });

    await pool.query(
      `
          UPDATE sessions
          SET verification_code = $1, status = 'VERIFYING_TWITTER', updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $2
        `,
      [code, context.from!.id]
    );
    return;
  } catch (error) {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Please try again later.`,
    });

    console.error("Error in verifyTwitter:", error);
  }
};

export const changeTwitter = async function (context: CallbackQueryContext) {
  try {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: "Please enter your new Twitter username to connect e.g defigenie:",
    });

    await pool.query(
      `
      UPDATE sessions
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
    `,
      ["AWAITING_TWITTER", context.from!.id]
    );
    return;
  } catch (error) {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Please try again later.`,
    });

    console.error("Error in changeTwitter:", error);
  }
};

export const completeVerification = async function (
  context: CallbackQueryContext
) {
  try {
    const data = await pool.query(
      `
      SELECT twitter_id, verification_code, twitter_username FROM sessions
      WHERE user_id = $1
    `,
      [context.from!.id]
    );

    const user = data.rows[0] as UserSession;

    console.log("User session data:", user);

    if (!user?.twitter_id) {
      await telegram.api.sendMessage({
        chat_id: context.from!.id,
        text: `No Twitter account connected. Please connect your Twitter account first.`,
        reply_markup: InlineKeyboard.keyboard([
          [connect_twitter({ user })],
          [view_active_campaigns({ user })],
        ]),
      });

      return;
    }

    if (!user?.verification_code) {
      await telegram.api.sendMessage({
        chat_id: context.from!.id,
        text: `No verification code found. Please initiate the verification process again.`,
        reply_markup: InlineKeyboard.keyboard([
          [verify_account({ user })],
          [change_twitter({ user })],
        ]),
      });

      return;
    }

    const url = `https://api.twitterapi.io/twitter/user/last_tweets?userId=${user.twitter_id}`;
    const options = {
      method: "GET",
      headers: { "X-API-Key": process.env["U_TWITTER_API_KEY"]! },
    };

    try {
      const response = await fetch(url, options);
      const data = (await response.json()) as {
        data: { tweets: Tweet[] };
        code: number;
        msg: string;
      };

      if (data?.code !== 0) {
        await telegram.api.sendMessage({
          chat_id: context.from!.id,
          text: data?.msg,
          reply_markup: InlineKeyboard.keyboard([
            [confirm_verification({ user })],
            [change_twitter({ user })],
          ]),
        });

        return;
      }

      const postedVerification = data.data.tweets.some((tweet) => {
        return (
          tweet.text
            .trim()
            .toLowerCase()
            .includes(`engage${user.verification_code}`.toLowerCase()) &&
          !tweet.isReply &&
          tweet.type === "tweet"
        );
      });

      if (postedVerification) {
        await telegram.api.sendMessage({
          chat_id: context.from!.id,
          text: `✅ Hey ${user.twitter_username}, your Twitter account has been successfully verified! You can now access all features.`,
          reply_markup: InlineKeyboard.keyboard([
            [add_campaign({ user })],
            [check_points({ user }), my_campaigns({ user })],
            [view_active_campaigns({ user })],
          ]),
        });

        await pool.query(
          `
          UPDATE sessions
          SET twitter_username_verified = TRUE, status = 'VERIFIED', updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $1
        `,
          [context.from!.id]
        );
      } else {
        await telegram.api.sendMessage({
          chat_id: context.from!.id,
          text: `We couldn't find the verification tweet on your Twitter account. Please ensure you've posted the tweet with the correct code and try again.`,
          reply_markup: InlineKeyboard.keyboard([
            [confirm_verification({ user })],
            [change_twitter({ user })],
          ]),
        });
        return;
      }

      console.log("verified user: ", user);
    } catch (error) {
      await telegram.api.sendMessage({
        chat_id: context.from!.id,
        text: `Error verifying Twitter account. Please try again later.`,
        reply_markup: InlineKeyboard.keyboard([
          [confirm_verification({ user })],
          [change_twitter({ user })],
        ]),
      });
      console.error(error);
    }
  } catch (error) {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Please try again later.`,
    });

    console.error("Error in completeVerification:", error);
  }
};

export const viewActiveCampaigns = async function (
  context: CallbackQueryContext
) {
  try {
    const campaigns = await pool.query(
      `
      SELECT * FROM campaigns
      WHERE expires_at > CURRENT_TIMESTAMP
      LEFT JOIN engagements ON campaigns.id = engagements.campaign_id
      GROUP BY campaigns.id
      HAVING COUNT(engagements.id) < campaigns.max_participants OR campaigns.max_participants IS NULL
      AND campaigns.status = 'ACTIVE'
    `
    );
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `Here are the active campaigns: ... (this is a placeholder)`,
    });
  } catch (error) {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Please try again later.`,
    });

    console.error("Error in viewActiveCampaigns:", error);
  }
};
