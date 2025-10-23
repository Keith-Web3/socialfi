import { CallbackQueryContext, InlineKeyboard, Keyboard } from 'puregram'
import pool from '../lib/db/db'
import telegram from '../lib/telegram'
import crypto from 'crypto'
import {
  add_campaign,
  add_campaign_description,
  add_campaign_title,
  change_twitter,
  check_points,
  confirm_verification,
  connect_twitter,
  delete_campaign,
  my_campaigns,
  quit_campaign,
  verify_account,
  view_active_campaigns,
} from '../utils/keyboard'
import { Campaign, Tweet, UserSession } from '../types'

export const connectTwitter = async function (context: CallbackQueryContext) {
  try {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: '✍️ Please enter your Twitter username (e.g. @defigenie or defigenie).',
    })

    await pool.query(
      `
          UPDATE sessions
          SET status = $1, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $2
        `,
      ['AWAITING_TWITTER', context.from!.id]
    )
  } catch (error) {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Type /start to try again.`,
    })

    console.error('Error in handleConnectTwitter:', error)
  }
}

export const verifyTwitter = async function (
  context: CallbackQueryContext,
  user: UserSession
) {
  try {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()

    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `🧩 To verify your Twitter account, follow these steps:\n\n1. Post a tweet from @${user.twitter_username} containing this code: #Engage${user.verification_code}\n2. After posting, return here and tap "✅ Complete Verification"\n\nIf you made a mistake or want to use a different account, you can change your Twitter username.`,
      reply_markup: InlineKeyboard.keyboard([
        [confirm_verification],
        [change_twitter],
      ]),
    })

    await pool.query(
      `
          UPDATE sessions
          SET verification_code = $1, status = 'VERIFYING_TWITTER', updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $2
        `,
      [code, context.from!.id]
    )
    return
  } catch (error) {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Type /start to try again.`,
    })

    console.error('Error in verifyTwitter:', error)
  }
}

export const changeTwitter = async function (context: CallbackQueryContext) {
  try {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: 'Please enter your new Twitter username to connect e.g defigenie:',
    })

    await pool.query(
      `
      UPDATE sessions
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
    `,
      ['AWAITING_TWITTER', context.from!.id]
    )
    return
  } catch (error) {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Type /start to try again.`,
    })

    console.error('Error in changeTwitter:', error)
  }
}

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
    )

    const user = data.rows[0] as UserSession

    console.log('User session data:', user)

    if (!user?.twitter_id) {
      await telegram.api.sendMessage({
        chat_id: context.from!.id,
        text: `No Twitter account connected. Please connect your Twitter account first.`,
        reply_markup: InlineKeyboard.keyboard([
          [connect_twitter],
          [view_active_campaigns],
        ]),
      })

      return
    }

    if (!user?.verification_code) {
      await telegram.api.sendMessage({
        chat_id: context.from!.id,
        text: `No verification code found. Please initiate the verification process again.`,
        reply_markup: InlineKeyboard.keyboard([
          [verify_account],
          [change_twitter],
        ]),
      })

      return
    }

    const url = `https://api.twitterapi.io/twitter/user/last_tweets?userId=${user.twitter_id}`
    const options = {
      method: 'GET',
      headers: { 'X-API-Key': process.env['U_TWITTER_API_KEY']! },
    }

    try {
      const response = await fetch(url, options)
      const data = (await response.json()) as {
        data: { tweets: Tweet[] }
        code: number
        msg: string
      }

      if (data?.code !== 0) {
        await telegram.api.sendMessage({
          chat_id: context.from!.id,
          text: data?.msg,
          reply_markup: InlineKeyboard.keyboard([
            [confirm_verification],
            [change_twitter],
          ]),
        })

        return
      }

      const postedVerification = data.data.tweets.some(tweet => {
        return (
          tweet.text
            .trim()
            .toLowerCase()
            .includes(`engage${user.verification_code}`.toLowerCase()) &&
          !tweet.isReply &&
          tweet.type === 'tweet'
        )
      })

      if (postedVerification) {
        await telegram.api.sendMessage({
          chat_id: context.from!.id,
          text: `✅ Hey ${user.twitter_username}, your Twitter account has been successfully verified! You have been awarded 100 points and can now access all features.`,
          reply_markup: InlineKeyboard.keyboard([
            [add_campaign],
            [check_points, my_campaigns],
            [view_active_campaigns],
          ]),
        })

        await pool.query(
          `
          UPDATE sessions
          SET twitter_username_verified = TRUE, status = 'VERIFIED', updated_at = CURRENT_TIMESTAMP, points = points + 100
          WHERE user_id = $1
        `,
          [context.from!.id]
        )
      } else {
        await telegram.api.sendMessage({
          chat_id: context.from!.id,
          text: `We couldn't find the verification tweet on your Twitter account. Please ensure you've posted the tweet with the correct code and try again.`,
          reply_markup: InlineKeyboard.keyboard([
            [confirm_verification],
            [change_twitter],
          ]),
        })
        return
      }

      console.log('verified user: ', user)
    } catch (error) {
      await telegram.api.sendMessage({
        chat_id: context.from!.id,
        text: `Error verifying Twitter account. Please try again later.`,
        reply_markup: InlineKeyboard.keyboard([
          [confirm_verification],
          [change_twitter],
        ]),
      })
      console.error(error)
    }
  } catch (error) {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Type /start to try again.`,
    })

    console.error('Error in completeVerification:', error)
  }
}

export const viewActiveCampaigns = async function (
  context: CallbackQueryContext
) {
  try {
    const campaigns = await pool.query<Campaign>(
      `
    SELECT campaigns.*, COUNT(engagements.id) AS engagement_count
    FROM campaigns
    LEFT JOIN engagements ON campaigns.id = engagements.campaign_id
    WHERE campaigns.expires_at > CURRENT_TIMESTAMP
      AND campaigns.status = 'ACTIVE'
    GROUP BY campaigns.id
    HAVING 
      COUNT(engagements.id) < campaigns.max_participants
      OR campaigns.max_participants IS NULL;
    `
    )

    if (campaigns.rowCount === 0) {
      await telegram.api.sendMessage({
        chat_id: context.from!.id,
        text: `There are currently no active campaigns available. Please check back later.`,
      })
      return
    }
    const campaignList = campaigns.rows.map(campaign => {
      return telegram.api.sendMessage({
        chat_id: context.from!.id,
        text: `Campaign: ${campaign.title}\nDescription: ${
          campaign.description
        }\nPoints per Engagement: ${
          campaign.points_per_engagement
        }\nMax Participants: ${
          campaign.max_participants ?? 'Unlimited'
        }\nStatus: ${campaign.status}`,
        reply_markup: InlineKeyboard.keyboard([
          [
            InlineKeyboard.urlButton({
              text: 'View Post',
              url: campaign.tweet_url,
            }),
          ],
        ]),
      })
    })

    await Promise.all(campaignList)
  } catch (error) {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Type /start to try again.`,
    })

    console.error('Error in viewActiveCampaigns:', error)
  }
}

export const createCampaign = async function (
  context: CallbackQueryContext,
  user: UserSession
) {
  try {
    const existingCampaign = await pool.query<Campaign>(
      `
      SELECT * FROM campaigns
      WHERE owner_id = $1 AND status = 'DRAFT'
    `,
      [context.from!.id]
    )

    if (existingCampaign?.rowCount && existingCampaign.rowCount > 0) {
      const campaignStatus = user.last_verified_action

      await telegram.api.sendMessage({
        chat_id: context.from!.id,
        text: `You already have a draft campaign. Please complete or delete it before creating a new one.`,
        reply_markup: InlineKeyboard.keyboard([
          [
            campaignStatus === 'ADD_CAMPAIGN_URL'
              ? add_campaign_title
              : campaignStatus === 'ADD_CAMPAIGN_TITLE'
              ? add_campaign_description
              : add_campaign,
          ],
          [delete_campaign],
        ]),
      })
      return
    }

    await pool.query(
      `
      UPDATE sessions
      SET last_verified_action = 'CREATE_CAMPAIGN', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `,
      [context.from!.id]
    )

    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `Please send the link to the tweet you want to create a campaign for.\n\nExample: https://x.com/someuser/status/123456789`,
      reply_markup: InlineKeyboard.keyboard([[quit_campaign]]),
    })
  } catch (error) {
    console.error('Error in createCampaign:', error)
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Type /start to try again.`,
    })
  }
}

export const quitCreatingCampaign = async function (
  context: CallbackQueryContext
) {
  try {
    await pool.query(
      `
      UPDATE sessions
      SET last_verified_action = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `,
      [context.from!.id]
    )

    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `✅ Campaign creation has been cancelled and draft data has been removed.`,
      reply_markup: InlineKeyboard.keyboard([[add_campaign]]),
    })
  } catch (error) {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Type /start to try again.`,
    })
    console.error('Error in quitCreatingCampaign:', error)
  }
}

export const deleteCampaign = async function (context: CallbackQueryContext) {
  try {
    await pool.query(
      `
      DELETE FROM campaigns
      WHERE owner_id = $1 AND status = 'DRAFT'
    `,
      [context.from!.id]
    )

    await pool.query(
      `
      UPDATE sessions
      SET last_verified_action = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `,
      [context.from!.id]
    )

    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `✅ Draft campaign has been deleted.`,
      reply_markup: InlineKeyboard.keyboard([[add_campaign]]),
    })
  } catch (error) {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Type /start to try again.`,
    })
    console.error('Error in deleteCampaign:', error)
  }
}

export const checkPoints = async function (context: CallbackQueryContext) {
  try {
    const data = await pool.query(
      `
      SELECT points FROM sessions
      WHERE user_id = $1
    `,
      [context.from!.id]
    )

    const points = data.rows[0]?.points || 0

    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `You currently have ${points} points.`,
    })
  } catch (error) {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Type /start to try again.`,
    })
    console.error('Error in checkPoints:', error)
  }
}

export const myCampaigns = async function (context: CallbackQueryContext) {
  try {
    const campaigns = await pool.query<Campaign>(
      `
      SELECT * FROM campaigns
      WHERE owner_id = $1
    `,
      [context.from!.id]
    )

    if (campaigns.rowCount === 0) {
      await telegram.api.sendMessage({
        chat_id: context.from!.id,
        text: `You have no campaigns yet.`,
      })
      return
    }

    const campaignList = campaigns.rows.map(campaign => {
      return telegram.api.sendMessage({
        chat_id: context.from!.id,
        text: `Campaign: ${campaign.title}\nDescription: ${
          campaign.description
        }\nPoints per Engagement: ${
          campaign.points_per_engagement
        }\nMax Participants: ${
          campaign.max_participants ?? 'Unlimited'
        }\nStatus: ${campaign.status}`,
      })
    })

    await Promise.all(campaignList)
  } catch (error) {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Type /start to try again.`,
    })
    console.error('Error in myCampaigns:', error)
  }
}

export const publishCampaign = async function (context: CallbackQueryContext) {
  try {
    await pool.query(
      `
      UPDATE sessions
      SET last_verified_action = 'PUBLISH_CAMPAIGN', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `,
      [context.from!.id]
    )

    await pool.query(
      `
      UPDATE campaigns
      SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
      WHERE owner_id = $1
      `,
      [context.from!.id]
    )

    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `Your campaign is now live! 🎉 Participants can start engaging with your tweet to earn points.`,
      reply_markup: InlineKeyboard.keyboard([[delete_campaign]]),
    })
  } catch (error) {
    await telegram.api.sendMessage({
      chat_id: context.from!.id,
      text: `❌ An error occurred while processing your request. Type /start to try again.`,
    })
    console.error('Error in publishCampaign:', error)
  }
}
