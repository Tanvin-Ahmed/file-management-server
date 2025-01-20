# file-management-server

An advance file management app server where almost all kind of api for file management system are available.

## Technologies used to develop:

- JavaScript
- Node.js
- Express.js
- MongoDB
- Mongoose
- GridFS
- Jsonwebtoken

## Configuration guidelines

### How to configure and run this project in your local machine?

1st of all you need to clone this project from github. To do that open you CMD then go to that directory where you want to save this project and run the following command

```
git clone https://github.com/Tanvin-Ahmed/file-management-server.git
```

After that to install all dependencies to run this project go to the project root directory then run the following command

```
npm install
```

If you use yarn then run the following command

```
yarn
```

Then press the enter and automatically all dependencies are installed!

After that you need to create a .env file in your project root directory and setup some environment variables.

```
DB_URI = # mongodb uri
SECRET_KEY = # for jsonwebtoken
EMAIL_SERVICE = # for nodemailer service
EMAIL_FROM = # for nodemailer service
EMAIL_PASSWORD = # for nodemailer service
MAX_STORAGE_PER_USER = 16106127360 # 15 GB in bytes
```

After set all environment variables you are ready to run this project in your local machine.

Then just run the following command

```
npm run dev
```

Or if you use yarn then run

```
yarn run dev
```

## API References

### User API References

#### Register user - POST API (public)

```
url = http://localhost:3000/api/v1/user/register
body = {
    username: 'your name',
    email: 'youremail@gmail.com',
    password: 'your password'
}

// please use a valid email address so that you can get email back
```

#### Login user - POST API (public)

```
url = http://localhost:3000/api/v1/user/login
body = {
    email: 'youremail@gmail.com',
    password: 'your password'
}
```

#### Update username - PUT API (private)

```
url = http://localhost:3000/api/v1/user/update/:userId
headers = {Authorization: 'Bearer ' + jwt_token}
body = {
    username: 'new username'
}
```

#### Update profile image - PUT API (private)

```
url = http://localhost:3000/api/v1/user/update-profile
headers = {Authorization: 'Bearer ' + jwt_token}
formData = {
    file: image,
}
```

#### View Profile image - GET API (private)

```
url = http://localhost:3000/api/v1/user/profile-preview?imageId={gridfs_image_id}
headers = {Authorization: 'Bearer ' + jwt_token}
```

#### Forgot Password - POST API (private)

```
url = http://localhost:3000/api/v1/user/forgot-password
headers = {Authorization: 'Bearer ' + jwt_token}
body = {
    email: 'youremail@gmail.com' // by which email you registered in your account
}

// it will send you an email with verification code so please use a valid email address
```
