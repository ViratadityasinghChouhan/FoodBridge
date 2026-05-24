# FoodBridge Setup

## Local Development

1. Start MongoDB locally on `127.0.0.1:27017`.
2. Configure `backend/.env`.
3. From `backend/`, run:

```bash
npm install
npm run dev
```

4. From `frontend/`, run when you change frontend code:

```bash
npm install
npm run build
```

The backend serves the built frontend at `http://localhost:5002`.

## Required Environment Variables

```env
NODE_ENV=development
PORT=5002
MONGO_URI=mongodb://127.0.0.1:27017/foodbridge
JWT_SECRET=change_me
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5002
API_URL=http://localhost:5002

GOOGLE_CLIENT_ID=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=FoodBridge <your-email@gmail.com>

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

DEV_OTP_FALLBACK=true
```

Set `DEV_OTP_FALLBACK=false` in production so OTPs are only delivered through email/SMS providers.

## Auth Flow

- Donors must verify both email and phone before posting food.
- Receivers must verify phone before requesting food.
- Email OTP and phone OTP expire after 5 minutes.
- Each OTP allows 3 failed attempts before resend is required.
- Admins can view users, block accounts, and mark NGO verification status.

## Main APIs

```text
POST /api/auth/signup
POST /api/auth/register
POST /api/auth/login
POST /api/auth/send-email-otp
POST /api/auth/verify-email-otp
POST /api/auth/send-phone-otp
POST /api/auth/verify-phone-otp
POST /api/auth/resend-otp
POST /api/auth/google
GET  /api/auth/me
GET  /api/auth/users
PUT  /api/auth/users/:id/block
PUT  /api/auth/users/:id/verify-ngo
```

Aliases are also available under `/api`, for example `POST /api/signup` and `POST /api/login`.

## Docker/Jenkins

Docker Compose lives in `devops/docker-compose.yml`.
Jenkins pipeline lives in `devops/Jenkinsfile`.

Pass SMTP/Twilio/Google credentials into the Jenkins or Docker environment before deployment.
