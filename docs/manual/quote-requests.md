# Website quote requests

## How requests arrive

When the public site is on (**Settings → Public Site**), visitors can send a quote request with their name, email, phone, the service they want, a preferred date, and details. Each service in your catalog appears as an option on the form.

When someone submits the form:

1. They're saved as a **prospect** in **Clients** (requires a database), with the request in their notes. If the email matches an existing client, that record is updated instead of creating a duplicate.
2. You get a **notification email** with the request details. It goes to `ADMIN_NOTIFICATION_EMAIL`, or the From address if that isn't set ([email settings](../configuration.md#email)).
3. The visitor gets a **confirmation email** thanking them for the request.

Emails need outgoing mail configured on the server — check **Tools → System** if they aren't arriving.

## Following up

1. Open **Clients** — prospects are labeled so you can spot new requests.
2. Reply, visit, or call as you normally would.
3. When you're ready to price the work, create a **job** for them and send an **estimate** or **quote** from it (see [Your first job, start to finish](first-job.md)).
4. Use **Mark as client** once they become a customer, or delete the record if the request goes nowhere.

## Tuning the form

The service dropdown comes from your **service catalog** in **Settings → Public Site** — add, rename, or remove services there. Turn the public site off entirely if you don't want web requests; your homepage becomes a simple branded card with a sign-in link.
