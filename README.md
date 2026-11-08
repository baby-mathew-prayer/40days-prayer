# A Village of Prayer for Baby Mathew

A mobile-friendly signup page for November 8–December 17, 2026. GitHub Pages hosts the static website; Supabase stores shared signups and serves a subscribable calendar. People can choose the same day. Calendar events contain the name or church signing up, but **not** the optional prayer name.

The site is not connected or published until you complete the steps below. GitHub Pages and Supabase offer free tiers, subject to their current limits and terms. Supabase may pause a free project after a period of inactivity. Calendar apps refresh subscriptions at their own pace, so changes may take time to appear.

## Set up the database

1. Create a Supabase project at [supabase.com](https://supabase.com/).
2. In its SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql) **once** for a new project. Then run [`supabase/upgrade-device-signup.sql`](supabase/upgrade-device-signup.sql). If you already installed either earlier signup schema, run only the upgrade script. It removes the old email-authentication write policies and enables the new signup functions in a transaction. Existing signups remain visible, but do not have device keys; the organizer can remove them in Supabase.
3. In the project's API settings, copy the project URL and **publishable** API key. Edit [`config.js`](config.js) and fill in both values. The publishable key is intended to be public; never put a secret or service-role key in the website or repository.

Anyone with the site link can view and add signups without signing in. Each new signup has a random removal key stored in the browser that submitted it. That browser can remove the signup; to change it, remove it and submit it again. Clearing browser data, using private browsing, switching browsers or devices, or changing the Supabase project URL can lose access to the key. If that happens, ask the project owner to remove the signup in Supabase. The database stores a hash, not the removal key.

The optional prayer name is publicly visible on the website and through the database API; excluding it from the calendar does **not** make it private. Ask for consent before sharing names. Do not enter email addresses, medical details, or other sensitive information in the public name fields. Anonymous signups can attract spam; monitor the project and add abuse protection before using it broadly. Signup requires HTTPS and browser storage. Email/SMTP setup is no longer needed; previously created Supabase Auth users are not automatically deleted.

## Publish the calendar feed

Install the [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started), sign in, and link this directory to your project, then deploy the function:

```text
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy prayer-calendar
```

The configuration in [`supabase/config.toml`](supabase/config.toml) makes this read-only feed publicly accessible without a login, as phone calendar apps cannot supply a Supabase API key. The function uses Supabase's automatically provided `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEYS` environment variables and only requests the columns needed for the feed.

Open `https://YOUR_PROJECT_REF.supabase.co/functions/v1/prayer-calendar` in a browser to check that it returns calendar data. The function returns an error rather than an empty calendar if the database is unavailable.

## Publish the website

1. Put these files in the `40days-prayer` repository under the `baby-mathew-prayer` GitHub account or organization to use `https://baby-mathew-prayer.github.io/40days-prayer/`. For GitHub Free, use a public repository for GitHub Pages.
2. In repository **Settings → Pages**, select **Deploy from a branch**, your publishing branch, and the root folder. Save and wait for GitHub to publish the URL.
3. Open the published HTTPS site, submit a test signup, and check that it appears on another device. Verify that only the original browser shows the removal button, and remove the test signup from that browser. Test on both iOS and Android if available.
4. Open the calendar feed URL and subscribe from a phone. On Apple devices, the **Subscribe to calendar** button should open the calendar app. For Google Calendar, copy the **Calendar feed URL**, then on Google Calendar on the web choose **Other calendars → From URL**; the subscription can then appear in the phone app using the same account. Verify visibility and refresh behavior on the devices you intend to use.

Adding a subscription does not automatically add it to anyone else's phone. Each person must subscribe. The calendar URL is public and anyone who has it can access the events. Revoking or changing a link requires additional configuration; do not treat it as a secret.

## Notes for the organizer

- Dates are deliberately limited to the 40-day period in the screenshots. To change the campaign, update both the website date logic in [`app.js`](app.js) and the database date constraint, and adjust the displayed text.
- Back up signups if they are important to you. Free-tier availability and backup options are limited.
- The site uses Google Fonts; system fonts are used when they cannot load.
- Sources: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod).
