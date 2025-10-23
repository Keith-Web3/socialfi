import dotenv from 'dotenv'
import { UserSession } from './types'
import {
  addCampaignDescription,
  addCampaignUrl,
  addMaxParticipants,
  handleAddTwitter,
  handleStart,
  addCampaignTitle,
} from './handlers/message'
import pool from './lib/db/db'
import telegram from './lib/telegram'
import {
  changeTwitter,
  checkPoints,
  completeVerification,
  connectTwitter,
  createCampaign,
  deleteCampaign,
  myCampaigns,
  publishCampaign,
  quitCreatingCampaign,
  verifyTwitter,
  viewActiveCampaigns,
} from './handlers/callbacks'

dotenv.config()

telegram.updates.on('message', async context => {
  const res = await pool.query(
    `
    SELECT *  FROM sessions
    WHERE user_id = $1
  `,
    [context.from!.id]
  )

  const session = res.rows[0] as UserSession | undefined

  for (const key in session) {
    if (session[key as keyof UserSession] !== null) {
      session[key as keyof UserSession] = `${
        session[key as keyof UserSession]
      }` as never
    } else {
      delete session[key as keyof UserSession]
    }
  }

  if (context.text?.toLowerCase() === '/start') {
    await handleStart(context, session)
  }

  if (session?.status === 'AWAITING_TWITTER') {
    await handleAddTwitter(context, session)
  }

  if (session?.last_verified_action === 'CREATE_CAMPAIGN') {
    await addCampaignUrl(context)
  }

  if (session?.last_verified_action === 'ADD_CAMPAIGN_URL') {
    await addCampaignTitle(context)
  }

  if (session?.last_verified_action === 'ADD_CAMPAIGN_TITLE') {
    await addCampaignDescription(context)
  }

  if (session?.last_verified_action === 'ADD_CAMPAIGN_DESCRIPTION') {
    await addMaxParticipants(context)
  }
})

telegram.updates.on('callback_query', async context => {
  const data = JSON.parse(context.data!)

  const userData = await pool.query(
    `
    SELECT * FROM sessions
    WHERE user_id = $1
  `,
    [context.from!.id]
  )

  const user = userData.rows[0] as UserSession

  if (data.callback_data === 'connect_twitter') {
    await connectTwitter(context)
    return
  }

  if (data.callback_data === 'verify_account') {
    await verifyTwitter(context, user)
    return
  }

  if (data.callback_data === 'change_twitter') {
    await changeTwitter(context)
    return
  }

  if (data.callback_data === 'complete_verification') {
    await completeVerification(context)
    return
  }

  if (data.callback_data === 'view_active_campaigns') {
    await viewActiveCampaigns(context)
    return
  }

  if (data.callback_data === 'add_engagement_campaign') {
    await createCampaign(context, user)
    return
  }

  if (data.callback_data === 'quit_campaign') {
    await quitCreatingCampaign(context)
    return
  }

  if (data.callback_data === 'delete_campaign') {
    await deleteCampaign(context)
    return
  }

  if (data.callback_data === 'check_points') {
    await checkPoints(context)
    return
  }

  if (data.callback_data === 'my_campaigns') {
    await myCampaigns(context)
    return
  }

  if (data.callback_data === 'publish_campaign') {
    await publishCampaign(context)
    return
  }

  console.log('Callback query received:', context.data)
})

telegram.updates.startPolling()
