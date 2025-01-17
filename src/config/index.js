const config = {
  db_uri: process.env.DB_URI,
  jwt_secret: process.env.SECRET_KEY,
  email_service: process.env.EMAIL_SERVICE,
  email_from: process.env.EMAIL_FROM,
  email_password: process.env.EMAIL_PASSWORD,
  email_authorization: process.env.AUTHORIZATION,
  max_storage: Number(process.env.MAX_STORAGE_PER_USER),
};

module.exports = { config };
