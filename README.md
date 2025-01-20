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

### User management API References

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
url = http://localhost:3000/api/v1/user/update
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

#### Forgot Password - POST API (public)

```
url = http://localhost:3000/api/v1/user/forgot-password
body = {
    email: 'youremail@gmail.com' // by which email you registered in your account
}

// it will send you an email with verification code so please use a valid email address
```

#### Verification Code - POST API (public)

```
url = http://localhost:3000/api/v1/user/verify-code
body = {
    email: 'youremail@gmail.com' // by which email you registered in your account
    code: 'your code that get you by email'
}
```

#### Reset password - PUT API (public)

```
url = http://localhost:3000/api/v1/user/reset-password
body = {
    "email": "youremail@gmail.com",
    "password": "new password",
    "confirmPassword": "new confirm password",
}
```

#### Get summary information - GET API (private)

```
url = http://localhost:3000/api/v1/user/summary
headers = {Authorization: 'Bearer ' + jwt_token}

@response like = {
    "message": "Storage summary retrieved successfully.",
    "data": {
        "totalStorage": 16106127360, // bytes
        "usedStorage": 1019600, // bytes
        "availableStorage": 16105107760, // bytes
        "folderSize": 1019600, // bytes
        "imageFileSize": 1019600, // bytes
        "pdfFileSize": 0, // bytes
        "noteFileSize": 0 // bytes
    }
}
```

#### Logout - GET API (private)

```
url = http://localhost:3000/api/v1/user/logout
headers = {Authorization: 'Bearer ' + jwt_token}
```

#### Delete user - DELETE API (private)

```
url = http://localhost:3000/api/v1/user/delete
headers = {Authorization: 'Bearer ' + jwt_token}

// it just delete the logged in user.
```

### Folder management API References

#### Create a new folder - POST API (private)

```
url = http://localhost:3000/api/v1/folders/create
headers = {Authorization: 'Bearer ' + jwt_token}
body = {
    "folderName": "name",
    "parentFolderId": null // if you want to create folder in root dir
}
```

#### Copy the entire folder with it's files - POST API (private)

```
url = http://localhost:3000/api/v1/folders/copy-or-duplicate-folder
headers = {Authorization: 'Bearer ' + jwt_token}
body = {
    "folderId": "678b1c8beb4459f085e863a8",
    "destinationParentFolderId": null // folder copied or duplicate in root dir
}
```

#### Rename folder - PUT API (private)

```
url = http://localhost:3000/api/v1/folders/rename-folder/:folderId
headers = {Authorization: 'Bearer ' + jwt_token}
body = {
    "newFolderName": "new name",
}
```

#### Favorite folder toggle - PUT API (private)

```
url = http://localhost:3000/api/v1/folders/favorite-folder/:folderId
headers = {Authorization: 'Bearer ' + jwt_token}
body = {
    "isFavorite": true //{boolean}
}
```

#### Folder privacy update PUT API (private)

If user want to lock a folder or unlock a folder

```
url = http://localhost:3000/api/v1/folders/privacy-update
headers = {Authorization: 'Bearer ' + jwt_token}
body = {
    "folderId": "678b1c8beb4459f085e863a8",
    "privateStatus": true // {boolean} that means is api return private folders or public folders
}
```

#### Get all folders - GET API (private)

```
url = http://localhost:3000/api/v1/folders/all?private={boolean}
headers = {Authorization: 'Bearer ' + jwt_token}

@return a folder list
```

#### Get all items in a folder - GET API (private)

```
url = http://localhost:3000/api/v1/folders/folder-content?folderId={id}
headers = {Authorization: 'Bearer ' + jwt_token}

@return a folder items list
```

#### Get Recent items - GET API (private)

```
url = http://localhost:3000/api/v1/folders/recent-items?private={boolean}
headers = {Authorization: 'Bearer ' + jwt_token}

@return a recent items list
```

#### Delete folder with all files inside the folder - DELETE API (private)

```
url = http://localhost:3000/api/v1/folders/delete-folder/:folderId
headers = {Authorization: 'Bearer ' + jwt_token}
```

### File management API References

#### File upload - POST API (private)

```
url = http://localhost:3000/api/v1/files/save-files
headers = {Authorization: 'Bearer ' + jwt_token}
formData = {
    files: multiple file,
    folderId: null // null or valid id
}
```

#### File copy or duplicate - POST API (private)

```
url = http://localhost:3000/api/v1/files/copy-or-duplicate-file/:fileId
headers = {Authorization: 'Bearer ' + jwt_token}
body = {
    "folderId": null // destination folder id or null if destination is root directory
}
```

#### File rename - PUT API (private)

```
url = http://localhost:3000/api/v1/files/rename-file/:fileId
headers = {Authorization: 'Bearer ' + jwt_token}
body = {
    "newFileName": "meeting-room"
}
```

#### File favorite toggle - PUT API (private)

```
url = http://localhost:3000/api/v1/files/favorite-file/:fileId
headers = {Authorization: 'Bearer ' + jwt_token}
body = {
    "isFavorite": true // boolean
}
```

#### File privacy update - PUT API (private)

```
url = http://localhost:3000/api/v1/files/privacy-update
headers = {Authorization: 'Bearer ' + jwt_token}
body = {
    "fileId": "678bc82c63139d9df3486662",
    "privateStatus": true // boolean
}
```

#### Get all note files - GET API (private)

```
url = http://localhost:3000/api/v1/files/notes?private={boolean}
headers = {Authorization: 'Bearer ' + jwt_token}
```

#### Get all pdf files - GET API (private)

```
url = http://localhost:3000/api/v1/files/pdfs?private={boolean}
headers = {Authorization: 'Bearer ' + jwt_token}
```

#### Get all images files - GET API (private)

```
url = http://localhost:3000/api/v1/files/images?private={boolean}
headers = {Authorization: 'Bearer ' + jwt_token}
```

#### Get all favorite files - GET API (private)

```
url = http://localhost:3000/api/v1/files/favorite?private={boolean}
headers = {Authorization: 'Bearer ' + jwt_token}
```

#### Get files by date - GET API (private)

```
url = http://localhost:3000/api/v1/files/items-by-date?date={date}&private={boolean}
// example date=2015-01-19
headers = {Authorization: 'Bearer ' + jwt_token}
```

#### File preview - GET API (private)

```
url = http://localhost:3000/api/v1/files/preview-file?fileId={gridfs_file_id}
headers = {Authorization: 'Bearer ' + jwt_token}
```

### Delete file - DELETE API (private)

```
url = http://localhost:3000/api/v1/files/delete-file/:fileId
headers = {Authorization: 'Bearer ' + jwt_token}
```
