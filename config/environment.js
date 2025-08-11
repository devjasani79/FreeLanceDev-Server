// Backend Environment Configuration
// This file centralizes all environment variables and their fallbacks

const config = {
  // Database Configuration
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/freelancedev',
  
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Email Configuration
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    from: process.env.FROM_EMAIL || 'FreelanceHub <noreply@freelancedev.com>'
  },
  
  // Cloudinary Configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  
  // CORS Configuration
  cors: {
    origins: [
      'http://localhost:3000',
      'https://freelancedev.vercel.app',
      'https://freelancedevserver.onrender.com'
    ]
  },
  
  // Feature Flags
  features: {
    emailNotifications: true,
    fileUploads: true,
    realTimeChat: true,
    analytics: false
  }
};

// Validation
const requiredEnvVars = [
  'MONGO_URI',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0 && config.nodeEnv === 'production') {
  console.warn('Missing required environment variables:', missingVars);
}

module.exports = config; 