# Ecommerce Backend API

Node.js + Express ecommerce backend with authentication, products, cart, wishlist, addresses, orders, Razorpay payments, ImageKit uploads, MongoDB, Redis, and email support.

## Requirements

- Node.js
- npm
- MongoDB
- Redis
- ImageKit account
- Razorpay account
- SMTP email account

MongoDB must support transactions in production. MongoDB Atlas is recommended because this project uses transactions for order and payment flows.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env
```

3. Fill real values in `.env`.

4. Start the development server:

```bash
npm run dev
```

5. Start the production server:

```bash
npm start
```

## Environment Variables

| Name                           | Required | Description                                             |
| ------------------------------ | -------- | ------------------------------------------------------- |
| `PORT`                         | Yes      | Server port. Example: `3000`                            |
| `NODE_ENV`                     | Yes      | Use `development`, `test`, or `production`              |
| `CLIENT_URL`                   | Yes      | Frontend URL allowed by CORS                            |
| `DB_URL`                       | Yes      | MongoDB connection string                               |
| `REDIS_URL`                    | Yes      | Redis connection string                                 |
| `JWT_SECRET`                   | Yes      | JWT signing secret. Use at least 32 chars in production |
| `JWT_ACCESS_TOKEN_EXPIRES_IN`  | Yes      | Access token expiry. Example: `15m`                     |
| `JWT_REFRESH_TOKEN_EXPIRES_IN` | Yes      | Refresh token expiry. Example: `30d`                    |
| `IMAGEKIT_PRIVATE_KEY`         | Yes      | ImageKit private API key                                |
| `RAZORPAY_KEY_ID`              | Yes      | Razorpay key ID                                         |
| `RAZORPAY_KEY_SECRET`          | Yes      | Razorpay key secret                                     |
| `SMTP_HOST`                    | Yes      | SMTP server host                                        |
| `SMTP_PORT`                    | Yes      | SMTP server port. Use `465` for secure SMTP             |
| `SMTP_USER`                    | Yes      | SMTP username                                           |
| `SMTP_PASS`                    | Yes      | SMTP password or app password                           |
| `SMTP_FROM`                    | Yes      | Email sender address                                    |

## External Services

- **MongoDB:** stores users, products, carts, orders, addresses, sessions, and tokens.
- **Redis:** stores login attempt limits.
- **ImageKit:** stores product images.
- **Razorpay:** creates and verifies online payments.
- **SMTP:** sends password reset and email verification emails.

## API Base URL

```txt
/api/v1
```

Health check:

```txt
GET /health
```

## Main Routes

### Auth

```txt
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh-token
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/logout-all
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/change-password
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification-email
GET  /api/v1/auth/me
```

### Products

```txt
GET    /api/v1/products
GET    /api/v1/products/:id
GET    /api/v1/products/autocomplete?q=<term>
POST   /api/v1/products
POST   /api/v1/products/create
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id
GET    /api/v1/products/my-products
GET    /api/v1/products/my-products/:id
POST   /api/v1/products/:id/reviews
PUT    /api/v1/products/:id/reviews
DELETE /api/v1/products/:id/reviews
```

### Cart

```txt
POST   /api/v1/cart
POST   /api/v1/cart/add
GET    /api/v1/cart
PUT    /api/v1/cart
PUT    /api/v1/cart/:id
DELETE /api/v1/cart/:id
```

### Orders

```txt
POST /api/v1/orders
GET  /api/v1/orders
GET  /api/v1/orders/my-orders
GET  /api/v1/orders/:id
PUT  /api/v1/orders/:id/cancel
GET  /api/v1/orders/seller-orders
PUT  /api/v1/orders/:id/status
```

### Payments

```txt
POST /api/v1/payment/order
POST /api/v1/payment/verify-payment
POST /api/v1/payment/verify
```

Payment order creation requires an existing app order ID. The client cannot choose the payment amount.

### Addresses

```txt
POST   /api/v1/addresses
GET    /api/v1/addresses
GET    /api/v1/addresses/:id
PUT    /api/v1/addresses/:id
DELETE /api/v1/addresses/:id
```

### Wishlist

```txt
POST   /api/v1/wishlist/:productId
GET    /api/v1/wishlist
DELETE /api/v1/wishlist/:productId
```

## Testing

Run tests:

```bash
npm test
```

Tests use an in-memory MongoDB replica set because order/payment code uses MongoDB transactions. Redis must also be reachable from `REDIS_URL`.

## Deployment Checklist

- Set `NODE_ENV=production`.
- Use a production MongoDB URL that supports transactions.
- Use a production Redis URL.
- Set `CLIENT_URL` to your real frontend URL with `https://`.
- Use a strong `JWT_SECRET` with at least 32 characters.
- Add real ImageKit, Razorpay, and SMTP credentials.
- Run the server with `npm start`.
- Configure your platform health check to `GET /health`.

## Notes

- Request body size is limited to `1mb`.
- API rate limiting is enabled under `/api`.
- Refresh tokens are stored in httpOnly cookies.
- CORS only allows the configured `CLIENT_URL`.
