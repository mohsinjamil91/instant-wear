# InstantWear

A mobile-friendly clothing store with a 30-minute delivery promise, in the style of quick-commerce apps. Customers browse women's and men's collections, add items to a cart and place orders. The owner signs in to a private panel to manage clothes and orders.

## Features

Customer side
- Women and men collections with size selection and stock labels
- Cart with quantity controls, delivery fee and free-delivery threshold
- Checkout with phone, address and PIN code validation
- Order confirmation with a 30-minute countdown and live order status

Owner side
- Email and password sign-in (Firebase Authentication)
- Add, edit, hide and delete clothes (price, MRP, stock, sizes, colour)
- Live orders list with status updates (Placed, Packed, Out for delivery, Delivered, Cancelled)
- Stock reduces automatically when an order is packed
- Daily stats: orders, sales and low-stock items

## Tech stack

- HTML, CSS and vanilla JavaScript (no framework)
- Firebase Authentication and Cloud Firestore, with security rules that allow only the owner to change products and orders
- Hosted on Vercel

## Project structure

- index.html: page layout and styles
- app.js: storefront, cart, checkout and owner panel logic
- config.js: Firebase settings
- firestore.rules: database security rules

## Setup

1. Create a Firebase project, enable Email/Password sign-in and create a Firestore database.
2. Put your Firebase settings and the owner's user ID in config.js and firestore.rules.
3. Deploy the folder to Vercel.
4. Open the site with #owner at the end of the address to sign in as the owner.

## Possible next steps

- Online payments
- SMS or WhatsApp order alerts
- Delivery tracking for riders
