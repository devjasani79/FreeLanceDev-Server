# FreelanceDev Backend Server

A comprehensive backend server for the FreelanceDev platform, built with Node.js, Express, MongoDB, and Socket.io.

## 🚀 Features

- **Authentication System** - JWT-based auth with role management
- **Order Management** - Complete order lifecycle management
- **Real-time Chat** - Socket.io powered messaging system
- **Review System** - Rating and feedback management
- **File Uploads** - Cloudinary integration for media files
- **Email Notifications** - SMTP email service integration

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **File Storage**: Cloudinary
- **Email**: Nodemailer with Gmail SMTP
- **Authentication**: JWT (JSON Web Tokens)

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- Cloudinary account
- Gmail account for SMTP

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Server
PORT=5000
NODE_ENV=development

# Email (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
FROM_EMAIL="FreelanceHub" <your-email@gmail.com>

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FreeLanceDev-Server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Fill in your actual values

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/request-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Gigs
- `GET /api/gigs` - Get all gigs
- `POST /api/gigs` - Create new gig
- `GET /api/gigs/:id` - Get gig by ID
- `PUT /api/gigs/:id` - Update gig
- `DELETE /api/gigs/:id` - Delete gig

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order by ID
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/revision` - Request revision
- `PATCH /api/orders/:id/complete` - Complete order
- `PATCH /api/orders/:id/cancel` - Cancel order

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - Get user's conversations
- `GET /api/messages/conversation/:orderId` - Get conversation for order
- `PATCH /api/messages/mark-read` - Mark messages as read
- `DELETE /api/messages/:id` - Delete message

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/gig/:gigId` - Get reviews for gig
- `GET /api/reviews/user/:userId` - Get reviews for user
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

## 🔌 Socket.io Events

### Client to Server
- `join-order` - Join order room for real-time updates
- `leave-order` - Leave order room
- `new-message` - Send new message
- `order-status-update` - Update order status

### Server to Client
- `message-received` - New message received
- `status-updated` - Order status updated

## 🚀 Deployment

### Render (Recommended)

1. **Connect your GitHub repository**
2. **Set environment variables** in Render dashboard
3. **Deploy** - Render will automatically detect Node.js

### Railway

1. **Connect your GitHub repository**
2. **Set environment variables** in Railway dashboard
3. **Deploy** - Railway handles the rest

### Heroku

1. **Install Heroku CLI**
2. **Login and create app**
   ```bash
   heroku login
   heroku create your-app-name
   ```
3. **Set environment variables**
   ```bash
   heroku config:set MONGO_URI=your-mongo-uri
   heroku config:set JWT_SECRET=your-jwt-secret
   # ... set other variables
   ```
4. **Deploy**
   ```bash
   git push heroku main
   ```

## 📱 Frontend Integration

The frontend should be configured with:

```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
NEXT_PUBLIC_WEBSITE_URL=https://your-frontend-url.com
```

## 🔒 Security Features

- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Rate limiting (to be implemented)

## 📊 Database Models

- **User** - User accounts with roles
- **Gig** - Freelance service offerings
- **Order** - Client orders and project tracking
- **Message** - Chat messages between users
- **Review** - User feedback and ratings

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch
```

## 📝 API Documentation

For detailed API documentation, visit:
- Development: `http://localhost:5000/api-docs`
- Production: `https://your-domain.com/api-docs`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete order management system
- Real-time chat functionality
- Review and rating system
- File upload capabilities
- Email notification system

---

**Built with ❤️ for the FreelanceDev community**