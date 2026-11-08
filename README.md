# A Village of Prayer for Baby Mathew

A mobile-friendly signup page for November 8–December 17, 2026. GitHub Pages hosts the static website; Supabase stores shared signups and serves a subscribable calendar. People can choose the same day. Calendar events contain the name or church signing up, but **not** the optional prayer name.

The site is not connected or published until you complete the steps below. GitHub Pages and Supabase offer free tiers, subject to their current limits and terms. Supabase may pause a free project after a period of inactivity. Calendar apps refresh subscriptions at their own pace, so changes may take time to appear.

## Set up the database

1. Create a Supabase project at [supabase.com](https://supabase.com/).
2. In its SQL Editor, run the contents of [`supabase/schema.sql`](supabase/schema.sql) **once** for a new project. If you already ran the earlier anonymous-signup schema, run [`supabase/upgrade-email-auth.sql`](supabase/upgrade-email-auth.sql) instead. Existing signups remain visible but have no owner; only the organizer can remove them in Supabase.
3. In the project's API settings, copy the project URL and **publishable** API key. Edit [`config.js`](config.js) and fill in both values. The publishable key is intended to be public; never put a secret or service-role key in the website or repository.

Anyone can view signups, but adding one requires signing in through an email link. A signed-in person can remove their own signup; to change it, remove it and submit it again. The project owner can remove unwanted entries in the Supabase table editor.

Email addresses are stored by Supabase Auth and are not displayed in public signups or calendar events. Signups do expose an account ID, along with the name or church and the optional prayer name. The optional prayer name is publicly visible on the website and through the database API; excluding it from the calendar does **not** make it private. Ask for consent before sharing names. Do not enter email addresses, medical details, or other sensitive information in the public name fields. Email sign-in reduces anonymous submissions but does not prevent spam; monitor the project and add abuse protection before using it broadly.

## Configure email sign-in

1. In Supabase **Authentication → Sign In / Providers → Email**, make sure email sign-in is enabled and new users may sign up. Keep the default magic-link email templates unless deliberately configuring another flow.
2. In **Authentication → URL Configuration**, set the Site URL to the published GitHub Pages URL, including the repository path, and add that same URL to the redirect allow list. If the published page is `https://OWNER.github.io/REPOSITORY/`, the exact URL including the trailing slash must be allowed. Also add any exact local development URL you intend to use.
3. Configure [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) in Supabase before inviting others. Supabase's default email service only delivers to pre-authorized project team addresses and is heavily rate-limited; it will not work for the general public. An SMTP provider may have a free tier but can require domain verification, impose limits, or charge; check its current terms. Set credentials in Supabase, never in the repository.
4. Open the published HTTPS site, enter an email address, and use the emailed one-time link. After returning, choose a day and submit the prayer form. Test with two different accounts: each should be able to remove only its own signup. Test on a phone as well. If a link is opened in another browser, choose the prayer day again there.

Email links are time-limited, and Supabase applies email sending rate limits. The site uses the Supabase JavaScript client from jsDelivr; sign-in needs that library and an internet connection. Email sign-in does not work by simply opening the HTML file directly; use the published HTTPS site or an explicitly configured localhost development server.

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

1. Put these files in a GitHub repository. For GitHub Free, use a public repository for GitHub Pages.
2. In repository **Settings → Pages**, select **Deploy from a branch**, your publishing branch, and the root folder. Save and wait for GitHub to publish the URL.
3. Configure email sign-in as described above, then open the published site, sign in, submit a test signup, and check that it appears on another device. Remove the test entry using the signed-in account or Supabase.
4. Open the calendar feed URL and subscribe from a phone. On Apple devices, the **Subscribe to calendar** button should open the calendar app. For Google Calendar, copy the **Calendar feed URL**, then on Google Calendar on the web choose **Other calendars → From URL**; the subscription can then appear in the phone app using the same account. Verify visibility and refresh behavior on the devices you intend to use.

Adding a subscription does not automatically add it to anyone else's phone. Each person must subscribe. The calendar URL is public and anyone who has it can access the events. Revoking or changing a link requires additional configuration; do not treat it as a secret.

## Notes for the organizer

- Dates are deliberately limited to the 40-day period in the screenshots. To change the campaign, update both the website date logic in [`app.js`](app.js) and the database date constraint, and adjust the displayed text.
- Back up signups if they are important to you. Free-tier availability and backup options are limited.
- The site uses Google Fonts; system fonts are used when they cannot load.
- Sources: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod).
