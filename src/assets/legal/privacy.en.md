# Privacy and cookies

_Last updated: 23 October 2026_

THUMDER is an educational simulator of the DLX processor, free and open source (MIT licence). This page explains what data it uses, what for, and how you decide. You can change your choice at any time from **Privacy settings** in the footer.

## Controller

Antonio Mudarra Machuca, author of THUMDER. For any question about your data, open an issue on [GitHub](https://github.com/nonodev96/THUMDER/issues).

## Without an account, everything stays in your browser

If you use THUMDER without signing in, your programs and your settings are kept only in your browser. They are not sent to any server. You delete them from the file manager or by clearing the data of this site in your browser.

## What is kept in your browser (necessary)

These are not cookies: they do not travel to any server. They are needed for the simulator to work as you ask, so they do not need your consent (article 22.2 of the Spanish LSSI, which implements the ePrivacy Directive).

| Name | What for |
| :-- | :-- |
| `local_file_items` and the `thumder` database (IndexedDB) | Your files, when you have not signed in |
| `interfaceFileItem`, `program_modules` | The file open in the editor and the modules loaded with it |
| `thumder_configuration` | The settings of the simulator and of the multiview |
| `breakpoints`, `breakpoint_stages`, `watchpoints` | The breakpoints |
| `exercise_progress`, `exercise_locks` | Your progress in the exercises |
| `lang`, `theme`, `registers_tab`, `statistics_tab` | The language, the theme and the open tab of some views |
| `log_level` | The detail of the debug console |
| `thumder_consent` | Your privacy choice |

## With an account (optional)

If you sign in (with email and password, Google, GitHub or Apple), Firebase Authentication, by Google, processes your email, your name and your profile photo to identify you, and keeps the session in your browser. Your files are kept in Cloud Firestore, linked to your account, so that you have them on any computer.

- **Legal basis:** providing the service you ask for (article 6.1.b of the GDPR).
- **Retention:** while you have the account. You can delete your files at any time and delete the account (see below).

## Deleting your account

From THUMDER, on the web or in the desktop, Android and iOS applications: sign in, open your **Profile** and press **Delete the account**. Your account, your profile and all your files are deleted, in the cloud and on that device, and it cannot be undone. For your security, you must have signed in a few minutes before. If you cannot get into THUMDER, ask for the deletion with the contact above, from the email of your account, and it will be done within a month at most. The steps, and what is deleted and what is not, are in the **Delete the account** tab, above.

## Analytics (only if you accept them)

If you allow it, Google Analytics for Firebase counts, in aggregate, the visits, the pages used, the type of device and the approximate country, to know what to improve.

- **Cookies:** `_ga` and `_ga_<id>`, which last up to 2 years.
- **Legal basis:** your consent (article 6.1.a of the GDPR).
- **Who processes them:** Google LLC, as processor. The data may be processed in the United States, under the EU-US Data Privacy Framework.
- **Withdrawal:** from **Privacy settings**, in the footer. THUMDER stops sending data and deletes those cookies.

## Error reports (you can turn them off)

When a published version of THUMDER (the web or the desktop, Android and iOS applications) fails unexpectedly, it sends a technical report to Cloud Firestore:

- the message and the stack trace of the error;
- the view you were in, without parameters;
- the version of THUMDER, and whether it is the web or the desktop, Android or iOS application;
- the browser (its user agent) and the language.

It does not include your account, your files or the folders of your computer, and it uses no cookies. It is used to find and fix errors.

- **Legal basis:** the legitimate interest in the simulator working well (article 6.1.f of the GDPR). You can object by turning them off in **Privacy settings**.
- **Retention:** until the error is fixed.

## Hosting and external services

- The web is served by Netlify, which logs technical data of each request (such as the IP address) to deliver the page and protect it.
- The animations of the documentation are loaded from GitHub (`raw.githubusercontent.com`).
- If you sign in with Google, GitHub or Apple, their sign-in window opens (on Android and iOS, the one of the system), with their own privacy policy.
- The desktop application uses no cookies and no analytics.
- The Android and iOS applications use the same services as the web and keep your data on the device itself. Google Play and the App Store, where they are installed from, process the data of the download under their own policies.

## Your rights

You can ask for access, rectification, erasure, restriction and portability of your data, and object to its processing, with the contact above. If you think your request was not handled well, you can complain to the Spanish Data Protection Agency ([AEPD](https://www.aepd.es)).

## Changes

If what THUMDER uses changes, this page will be updated and you will be asked again.
