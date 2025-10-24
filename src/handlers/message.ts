import { InlineKeyboard, Keyboard, MessageContext } from 'puregram'
import { UserSession } from '../types'
import pool from '../lib/db/db'
import {
  add_campaign,
  change_twitter,
  check_points,
  confirm_verification,
  connect_twitter,
  delete_campaign,
  how_it_works,
  my_campaigns,
  publish_campaign,
  start_over,
  verify_account,
  view_active_campaigns,
} from '../utils/keyboard'

export const handleStart = async function (
  context: MessageContext,
  user?: UserSession
) {
  switch (user?.status) {
    case undefined: {
      await context.reply(
        `👋 Welcome to the Kaito Engagement Bot!\n\nWith this bot, you can:\n- Join engagement campaigns for Kaito posts 🧩\n- Earn visibility and points for your activity 🚀\n- Connect with other Kaito users in the community 🌐\n\nTo get started, please connect your Twitter account.`,
        {
          reply_markup: InlineKeyboard.keyboard([
            [connect_twitter],
            [view_active_campaigns],
          ]),
          parse_mode: 'markdown',
        }
      )

      await pool.query(
        `
      INSERT INTO sessions (user_id, status)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
    `,
        [context.from!.id, 'START']
      )
      break
    }
    case 'START': {
      await context.reply(`👋 Welcome back to the *Kaito Engagement Bot!*`, {
        reply_markup: InlineKeyboard.keyboard([
          [connect_twitter],
          [view_active_campaigns],
        ]),
        parse_mode: 'markdown',
      })

      break
    }
    case 'AWAITING_TWITTER': {
      await context.reply(
        `✍️ Please enter your Twitter username (e.g. @defigenie or defigenie).`,
        {
          parse_mode: 'markdown',
        }
      )

      break
    }
    case 'ADDED_TWITTER': {
      await context.reply(
        `✅ Your Twitter account @${user.twitter_username} has been successfully connected!\n\nTo access all features, please verify your ownership by posting a short verification tweet.`,
        {
          reply_markup: InlineKeyboard.keyboard([
            [verify_account, change_twitter],
          ]),
        }
      )

      break
    }
    case 'VERIFYING_TWITTER': {
      await context.reply(
        `🧩 To verify your Twitter account, follow these steps:\n\n1. Post a tweet from @${user.twitter_username} containing this code: #Engage${user.verification_code}\n2. After posting, return here and tap "✅ Complete Verification"\n\nIf you made a mistake or want to use a different account, you can change your Twitter username.`,

        {
          reply_markup: InlineKeyboard.keyboard([
            [confirm_verification, change_twitter],
          ]),
        }
      )

      break
    }
    case 'VERIFIED': {
      await context.reply(
        `🎉 Welcome back, @${user.twitter_username}! Your Twitter account is verified.\n\nYou can now:\n- Add new engagement campaigns 📢\n- Join existing campaigns 💬\n- Check your points and progress 🧮`,
        {
          reply_markup: Keyboard.keyboard([
            [add_campaign],
            [check_points, my_campaigns],
            [view_active_campaigns],
          ]).resize(),
        }
      )

      break
    }
  }

  return
}

export const handleAddTwitter = async function (
  context: MessageContext,
  user: UserSession
) {
  const twitterUsername = context.text?.trim().toLowerCase().replace('@', '')
  if (!twitterUsername) {
    context.reply('Invalid username. Please try again.', {
      reply_markup: InlineKeyboard.keyboard([connect_twitter, start_over]),
    })
    return
  }
  if (!/^[A-Za-z0-9_]{1,15}$/.test(twitterUsername)) {
    context.reply('Invalid Twitter username format. Please try again.', {
      reply_markup: InlineKeyboard.keyboard([connect_twitter, start_over]),
    })
    return
  }

  const usedBy = await pool.query(
    `
      SELECT user_id, twitter_username_verified FROM sessions
      WHERE twitter_username = $1
    `,
    [twitterUsername]
  )

  if (usedBy.rowCount && usedBy.rows[0].user_id === user.user_id) {
    context.reply(
      `The Twitter username @${twitterUsername} is already connected to your account.`,
      {
        reply_markup: InlineKeyboard.keyboard([
          ...(usedBy.rows[0].twitter_username_verified ? [verify_account] : []),
          change_twitter,
        ]),
      }
    )
    return
  }
  if (usedBy?.rowCount && usedBy?.rowCount > 0) {
    context.reply(
      `The Twitter username @${twitterUsername} is already in use by another user. Please choose a different username.`,
      {
        reply_markup: InlineKeyboard.keyboard([connect_twitter, start_over]),
      }
    )
    return
  }

  const url = `https://api.x.com/2/users/by/username/${twitterUsername}`
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env['TWITTER_BEARER_TOKEN']!}`,
    },
  }

  try {
    const response = await fetch(url, options)
    const data = await response.json()

    if (data?.errors?.[0]?.title === 'Not Found Error') {
      await context.reply(
        `The Twitter username @${twitterUsername} does not exist. Please check and try again.`,
        {
          reply_markup: InlineKeyboard.keyboard([connect_twitter, start_over]),
        }
      )
      return
    } else if (data?.errors?.length > 0) {
      await context.reply(
        `Error verifying Twitter username: ${data.errors[0].detail}. Please try again later.`,
        {
          reply_markup: InlineKeyboard.keyboard([connect_twitter, start_over]),
        }
      )
      return
    } else if (
      data?.data?.username.toLowerCase() === twitterUsername.toLowerCase()
    ) {
      await pool.query(
        `
          UPDATE sessions
          SET twitter_username = $1, twitter_id = $2, status = $3, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $4
        `,
        [twitterUsername, data.data.id, 'ADDED_TWITTER', context.from!.id]
      )

      await context.reply(
        `✅ Your Twitter account @${twitterUsername} has been successfully connected!\n\nTo access all features, please verify your ownership by posting a short verification tweet.`,
        {
          reply_markup: InlineKeyboard.keyboard([
            verify_account,
            change_twitter,
          ]),
        }
      )
    }
    console.log(data)
  } catch (error) {
    await context.reply(
      `Error verifying Twitter username. Please try again later.`,
      {
        reply_markup: InlineKeyboard.keyboard([connect_twitter, start_over]),
      }
    )
    console.error(error)
  }
}

export const addCampaignUrl = async function (context: MessageContext) {
  const tweetUrl = context.text?.trim().toLowerCase()

  if (!tweetUrl) {
    await context.reply(
      `❌ Please provide a valid Twitter tweet URL to add to your campaign.`
    )
    return
  }

  const tweetUrlRegex =
    /https?:\/\/(x\.com|twitter\.com)\/[\w_]+\/status\/(\d+)/

  if (!tweetUrlRegex.test(tweetUrl)) {
    await context.reply(
      `❌ The provided URL is not a valid Twitter tweet URL. Please check and try again.`
    )

    return
  }

  try {
    const tweetIdMatch = tweetUrl.match(tweetUrlRegex)
    const tweetId = tweetIdMatch ? tweetIdMatch[2] : null

    if (!tweetId) {
      throw new Error('Tweet ID could not be extracted from the URL.')
    }

    await pool.query(
      `
      INSERT INTO campaigns (owner_id, tweet_id, tweet_url, status, created_at, updated_at)
      VALUES ($1, $2, $3, 'DRAFT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
      [context.from!.id, tweetId, tweetUrl]
    )
    await pool.query(
      `
      UPDATE sessions
      SET last_verified_action = 'ADD_CAMPAIGN_URL', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `,
      [context.from!.id]
    )

    await context.reply(
      `✅ The tweet has been successfully added for your campaign. Please add a title for the campaign:`,
      {
        reply_markup: InlineKeyboard.keyboard([[delete_campaign]]),
      }
    )
  } catch (error) {
    await context.reply(
      `❌ An error occurred while processing your request. Please try again later.`
    )
    console.error('Error in addCampaignUrl:', error)
  }
}

export const addCampaignDescription = async function (context: MessageContext) {
  const description = context.text?.trim().toLowerCase()

  if (!description) {
    await context.reply(`❌ Please provide a valid campaign description.`)
    return
  }
  try {
    await pool.query(
      `
      UPDATE campaigns
      SET description = $1, updated_at = CURRENT_TIMESTAMP
      WHERE owner_id = $2 AND status = 'DRAFT'
    `,
      [description, context.from!.id]
    )

    await pool.query(
      `
      UPDATE sessions
      SET last_verified_action = 'ADD_CAMPAIGN_DESCRIPTION', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `,
      [context.from!.id]
    )

    await context.reply(
      `✅ The campaign description has been set. Kindly enter the maximum number of participants you want for your campaign, enter 0 if you don't have a limit:`,
      {
        reply_markup: InlineKeyboard.keyboard([[delete_campaign]]),
      }
    )
  } catch (error) {
    await context.reply(
      `❌ An error occurred while processing your request. Please try again later.`
    )
    console.error('Error in addCampaignDescription:', error)
  }
}

export const addMaxParticipants = async function (context: MessageContext) {
  try {
    const message = context.text?.trim().toLowerCase()

    if (!message || isNaN(Number(message)) || Number(message) < 0) {
      await context.reply(
        `❌ Please provide a valid number for maximum participants (0 or greater).`
      )
      return
    }

    const maxPart = Number(message)

    await pool.query(
      `
      UPDATE campaigns
      SET max_participants = $1, status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP
      WHERE owner_id = $2 AND status = 'DRAFT'
    `,
      [maxPart, context.from!.id]
    )

    await pool.query(
      `
      UPDATE sessions
      SET last_verified_action = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `,
      [context.from!.id]
    )

    await context.reply(
      `You can now make your campaign live.\n\nParticipants will earn:\n• 2 points for quoting\n• 1 point for retweeting\n• 1 point for commenting`,
      {
        reply_markup: InlineKeyboard.keyboard([
          [publish_campaign, delete_campaign],
        ]),
      }
    )
  } catch (error) {
    await context.reply(
      `❌ An error occurred while processing your request. Please try again later.`
    )
    console.error('Error in addMaxParticipants:', error)
  }
}

export const addCampaignTitle = async function (context: MessageContext) {
  const title = context.text?.trim().toLowerCase()

  try {
    await pool.query(
      `
      UPDATE campaigns
      SET title = $1, updated_at = CURRENT_TIMESTAMP
      WHERE owner_id = $2 AND status = 'DRAFT'
    `,
      [title, context.from!.id]
    )

    await pool.query(
      `
      UPDATE sessions
      SET last_verified_action = 'ADD_CAMPAIGN_TITLE', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `,
      [context.from!.id]
    )

    await context.reply(
      `✅ The campaign title has been set to "${title}". Please enter the campaign description.`,
      {
        reply_markup: InlineKeyboard.keyboard([[delete_campaign]]),
      }
    )
  } catch (error) {
    await context.reply(
      `❌ An error occurred while processing your request. Please try again later.`
    )
    console.error('Error in addCampaignTitle:', error)
  }
}
