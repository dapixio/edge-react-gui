// @flow

import { fetchLoginMessages } from 'edge-core-js'
import { AsyncStorage, Platform } from 'react-native'
import BackgroundFetch from 'react-native-background-fetch'
import PushNotification from 'react-native-push-notification'
import { sprintf } from 'sprintf-js'

import ENV from '../../env.json'
import * as Constants from '../constants/indexConstants.js'
import s from '../locales/strings.js'

export async function backgroundWorker () {
  console.log('appStateLog: running background task')
  const lastNotif = await AsyncStorage.getItem(Constants.LOCAL_STORAGE_BACKGROUND_PUSH_KEY)
  const now = new Date()
  if (lastNotif) {
    const lastNotifDate = new Date(lastNotif).getTime() / 1000
    const delta = now.getTime() / 1000 - lastNotifDate
    if (delta < Constants.PUSH_DELAY_SECONDS) {
      BackgroundFetch.finish()
      return
    }
  }
  try {
    const result = await fetchLoginMessages(ENV.AIRBITZ_API_KEY)
    const date = new Date(Date.now() + 1000)
    // for each key
    for (const key in result) {
      // skip loop if the property is from prototype
      if (!result.hasOwnProperty(key)) continue
      const obj = result[key]
      if (obj.otpResetPending) {
        if (Platform.OS === Constants.IOS) {
          PushNotification.localNotificationSchedule({
            title: s.strings.otp_notif_title,
            message: sprintf(s.strings.otp_notif_body, key),
            date
          })
        } else {
          PushNotification.localNotificationSchedule({
            message: s.strings.otp_notif_title,
            subText: sprintf(s.strings.otp_notif_body, key),
            date
          })
        }
      }
    }
  } catch (error) {
    global.bugsnag.notify(error)
    console.error(error)
  }
  await AsyncStorage.setItem(Constants.LOCAL_STORAGE_BACKGROUND_PUSH_KEY, now.toString())

  // Required: Signal completion of your task to native code
  // If you fail to do this, the OS can terminate your app
  // or assign battery-blame for consuming too much background-time
  BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NEW_DATA)
}
