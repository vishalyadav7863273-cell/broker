# Flat Rental Management System (MERN)

Built step by step. Current status:

- [x] Step 1: Backend foundation (models, auth, roles, admin bootstrap)
- [x] Step 2: Flats API + visit booking + Socket.IO admin notifications
- [ ] Step 3: Razorpay payments + webhook
- [x] Step 4 (partial): Admin APIs for visits, flats, tenants, staff & users. Reports / CSV export still to do
- [x] Step 5 (first pass): React + Tailwind frontend in `frontend/` (home, browse, flat detail + visit booking, user/tenant/admin login, tenant registration, dashboards)

## Run the backend (Step 1)

```bash
cd backend
npm install
cp .env.example .env        # Windows: copy .env.example .env
# edit .env: MONGODB_URI, JWT secrets, ADMIN_* values
npm run create-admin        # creates the first admin (run once)
npm run dev
```

Check: http://localhost:5000/api/health

## MongoDB Atlas setup

1. Create a free cluster at https://cloud.mongodb.com
2. Database Access -> add a database user (username + password)
3. Network Access -> add your IP (or 0.0.0.0/0 for testing only)
4. Connect -> Drivers -> copy the connection string into `MONGODB_URI`, replacing `<db_user>` and `<db_password>`

## Auth endpoints (Step 1)

| Method | Path | Purpose |
|---|---|---|
| POST | /api/auth/register | User portal signup |
| POST | /api/auth/customer/register | Tenant signup (creates users + customers records) |
| POST | /api/auth/login | body `portal`: user / customer / admin |
| POST | /api/auth/refresh | New access token from httpOnly cookie |
| POST | /api/auth/logout | Clear refresh cookie |
| GET/PUT | /api/auth/me | Profile |
| POST | /api/auth/forgot-password | Dev: link is printed in server console (no email provider yet) |
| POST | /api/auth/reset-password/:token | Set new password |

## Design notes

- `users`: login accounts (admin / staff / user). `customers`: tenant profile with optional `userId`; no passwords there.
- `visits_payments_notifications`: one collection, three Mongoose discriminators (`visit`, `payment`, `notification`) via `recordType`.
- Access token 15 min (Bearer header); refresh token in httpOnly cookie, revocable via `tokenVersion`.
- No public admin registration; admin is created only by `npm run create-admin`.

## Run the frontend

```bash
cd frontend
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm run dev              # http://localhost:5173
```

## Load demo flats (optional)

```bash
cd backend
npm install              # installs socket.io
npm run seed             # inserts 8 demo flats (skips ones that already exist)
```

## Admin workflow

- Admin / staff log in on the **Admin** tab of the login page. On login they see a toast with unread notifications and a bell badge in the header.
- When a tenant **books a visit**, **cancels a visit** or **registers**, a notification is saved and pushed live over Socket.IO (toast + sound + bell badge). No page refresh needed.
- Admin dashboard tabs: Overview (pending visits needing action), Visits (confirm, decline, complete, no-show, reopen, reschedule, assign staff), Flats (add, edit, quick status, delete), Tenants (search + full profile), Notifications (shared inbox), Staff & users (admin only: create staff, activate / deactivate).
- Staff can do everything except delete flats and manage users. Notifications are a shared inbox: marking one read marks it read for the whole team.

## New API endpoints

| Method | Path | Who |
|---|---|---|
| GET | /api/flats, /api/flats/areas, /api/flats/:id | public |
| POST / PUT | /api/flats, /api/flats/:id | staff, admin |
| DELETE | /api/flats/:id | admin |
| POST | /api/visits | tenant |
| GET | /api/visits/my | tenant |
| PATCH | /api/visits/:id/cancel | tenant (own) |
| GET | /api/visits?status= | staff, admin |
| PATCH | /api/visits/:id | staff, admin (status, visitDate, visitTime, assignedStaff) |
| GET | /api/notifications, PATCH /api/notifications/read-all, /api/notifications/:id/read | staff, admin |
| GET | /api/admin/overview, /api/admin/customers?search=, /api/admin/staff | staff, admin |
| GET / POST / PATCH | /api/admin/users, /api/admin/users/:id | admin |

Socket.IO connects to the API host with the access token. Events: `notification`, `visit:changed` (admins), `visit:updated` (tenant).

## Adding flats (admin)

- **+ Add flat** button is always visible at the top of the admin dashboard.
- In the **Tenants** tab, open a tenant's details to see available flats that match their requirement (size, area, budget) and press **Add a flat for <name>**. The form opens with size, area, furnishing and rent already filled from the tenant's requirement.

## Online payments (Razorpay)

1. Create a Razorpay account and copy the **test** keys into `backend/.env`: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
2. Optional but recommended: add a webhook in the Razorpay dashboard pointing to `https://<your-api>/api/payments/webhook` with events `payment.captured`, `order.paid`, `payment.failed`, and put its secret in `RAZORPAY_WEBHOOK_SECRET`. It confirms payments even if the tenant closes the browser early.
3. Flow: tenant books a visit, admin marks it **completed**, then the tenant sees **Pay online** next to Security deposit, Advance rent and Brokerage on the flat page. Amounts are computed by the server from the flat, never taken from the browser. The signature is verified before a payment is marked successful.
4. Admin gets a live "Payment received" notification and sees every payment in the **Payments** tab. Marking the flat **occupied** after payment is left to the admin.

| Method | Path | Who |
|---|---|---|
| POST | /api/payments/order, /api/payments/verify | tenant |
| GET | /api/payments/my | tenant |
| GET | /api/payments?status= | staff, admin |
| POST | /api/payments/webhook | Razorpay |

## Email alerts to the admin's Gmail

When a tenant **books a flat visit**, **registers** or **pays online**, an email goes to the admin Gmail with the tenant's name, phone, flat and visit time, plus a button that opens the dashboard. (The in-app live notification still works as before.)

1. In the Gmail account: turn on **2-Step Verification**, then create an **App password** at https://myaccount.google.com/apppasswords.
2. In `backend/.env` set:
   ```
   SMTP_USER=yourgmail@gmail.com
   SMTP_PASS=<the 16-character app password, not your normal password>
   ADMIN_NOTIFY_EMAIL=admin@gmail.com        # comma separated for several admins
   ```
3. Restart the backend. To see emails in the console instead of sending (development): `MAIL_DRY_RUN=true`.

Mail failures never block a booking or registration; they are only logged. The same mailer now sends password-reset links.

## Flat photos

- Flats without photos show a drawn room that matches the size (1RK, 1BHK, 2BHK+), so every card looks finished.
- Admin: **Flats > Add / Edit > Upload photos** (JPG, PNG, WebP, up to 5 MB, 6 at a time) or paste an image link. The first photo is the cover. Flat pages show a gallery.
- Uploads are saved in `backend/uploads/` and served at `/uploads/...`. Back this folder up in production, or move to cloud storage (S3 / Cloudinary) later.

## Emails to tenants (same Gmail)

Tenants now get emails too: welcome on sign-up, "visit request received" on booking, "visit confirmed / rescheduled / cancelled / completed" when the admin changes the visit, and a receipt after an online payment. Everything uses the `SMTP_*` settings in `backend/.env`; nothing is sent until `SMTP_PASS` is filled in.

**Gmail does not accept your normal account password for SMTP.** Use a 16-character App password (Google Account > Security > 2-Step Verification > App passwords) and keep it only in `backend/.env`, never in code or in a zip.

## Listing page, shortlist and scroll animations

- `/flats` is a filter + results page: search box, applied-filter chips, budget, bedrooms, furnishing, area, photo / shortlist / occupied switches, sort, quick chips and "show more". Filters live in the URL, so links can be shared.
- The heart shortlists a home in this browser (localStorage).
- The home page reveals sections as you scroll, has a scroll-progress bar, a back-to-top button and a moving ticker. All of it is switched off for visitors who prefer reduced motion.
- **Contact > Pay online**: tenants pay deposit, advance rent and brokerage for flats whose visit is completed (Razorpay).

## UPI QR payment (in addition to Razorpay)

- On a flat page (and under **Contact > Pay online**) each of Security deposit, Advance rent and Brokerage has two buttons: **Pay online** (Razorpay) and **UPI QR**.
- **UPI QR** shows the QR from `frontend/public/upi-qr.jpg`, the UPI ID, and a "pay exactly ₹X" note. The tenant pays in any UPI app, then types the 12-digit transaction ID (UTR). The payment is saved as *awaiting confirmation*.
- The admin gets a live notification and an email, opens **Payments**, checks the money in the UPI app, and presses **Confirm received** (or **Reject**, with an optional reason). Confirming marks it paid, notifies the team and emails the tenant a receipt. UPI has no automatic confirmation, so this check is manual.
- The same UTR cannot be submitted twice, and the amount is always taken from the flat on the server.
- To change the UPI account: replace `frontend/public/upi-qr.jpg` with the new QR and edit `frontend/src/config.js`.

## Flat details and photos

- `npm run seed` now adds **16 demo flats** with full details (carpet area, bathrooms, balconies, facing, age, parking, pets, best for, available from, maintenance). Flats that already exist only get the new detail fields filled in.
- The flat page has a **Property details** section and a gallery. Without uploaded photos it shows drawn views of the living room / bedroom / kitchen / balcony / building, clearly marked "Illustrative view". Real photos uploaded by the admin replace them.
- Admin **Flats > Add / Edit** has the new detail fields.

## Animations and extra features (public site)

**Animation:** the home headline slides in line by line, hero art moves with a slight parallax, soft floating colour blobs, a live count-up stats band, a smooth FAQ accordion, buttons with a shine sweep, page fade-in on every route, header that tightens and gets a shadow after scrolling, loading skeletons instead of spinners, heart "pop". Everything is turned off for visitors who prefer reduced motion.

**Features:**
- **Compare homes** (up to 3) with a bottom bar and a side-by-side page that marks the best rent, move-in cost, area and so on.
- **Shortlist counter** in the header (heart), synced everywhere.
- **Flat page:** Shortlist, Compare, Share on WhatsApp, Copy link, View on map, "Matches your requirement" chip for logged-in tenants (budget and size), trust points, **Similar homes** and **Recently viewed**.
- **Floating Call and WhatsApp buttons** on every public page. Set your real number in `frontend/src/config.js` (`CONTACT`); it is also used on the Contact page and footer.
- **FAQ** on the home page.
