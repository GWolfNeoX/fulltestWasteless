# API Documentation

This is the documentation for the API provided by the backend code you provided. The API is responsible for handling various operations related to user registration, login, posting food donations, viewing food lists, managing user profiles, and more. Below you will find details about the API endpoints, their functionality, and the expected request and response formats.

## Table of Contents
- [Authentication](#authentication)
- [User Registration](#user-registration)
- [User Login](#user-login)
- [Posting Food Donations](#posting-food-donations)
- [Viewing Food Lists](#viewing-food-lists)
- [Viewing Food Details](#viewing-food-details)
- [Viewing User Profile](#viewing-user-profile)
- [Updating User Profile](#updating-user-profile)
- [Viewing Donation History](#viewing-donation-history)
- [Creating Donation History](#creating-donation-history)
- [Updating Donation History](#updating-donation-history)

---

## Authentication

The following endpoints require authentication using a JSON Web Token (JWT) in the Authorization header of the request:

- `/homepage` (GET)
- `/postFood` (POST)
- `/userProfile` (GET, PUT)
- `/history` (GET, POST)
- `/history/:id` (PUT)
- `/foodList` (GET)
- `/foodDetail/:id` (GET)

To authenticate, include the JWT token in the `Authorization` header of the request using the `Bearer` scheme:

```
Authorization: Bearer <token>
```

The JWT token is obtained by logging in (`/login` endpoint).

---

## User Registration

### Register a new user

Endpoint: `/register` (POST)

Register a new user by providing their name, email, and password in the request body. The email must be unique, and the password must be at least 6 characters long.

#### Request

```json
POST /register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

#### Response

```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "message": "User created successfully"
}
```

---

## User Login

### Login with user credentials

Endpoint: `/login` (POST)

Authenticate a user by providing their email and password in the request body. Upon successful authentication, a JWT token will be returned.

#### Request

```json
POST /login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

#### Response

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "userId": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "token": "<jwt_token>"
}
```

---

## Posting Food Donations

### Post a new food donation

Endpoint: `/postFood` (POST)

Post a new food donation by providing the required information in the request body. An image file of the food and additional details such as food name, description, quantity, location, expiration date, and food type are required.

#### Request

```json
POST /postFood
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

{
  "foodName": "Food Item",
  "description": "This is a food item",
  "quantity": 5,
  "location": "Food Bank",
  "expiredAt": "2023-06-30",
  "foodType": "Vegetarian"


}

--file
Content-Disposition: form-data; name="fotoMakanan"; filename="food_image.jpg"
Content-Type: image/jpeg

<binary_file_data>
```

#### Response

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Food donation posted successfully"
}
```

---

## Viewing Food Lists

### Get a list of available food donations

Endpoint: `/foodList` (GET)

Retrieve a list of available food donations along with their details, such as food ID, food name, description, quantity, location, latitude, longitude, expiration date, and food type.

#### Request

```json
GET /foodList
Authorization: Bearer <jwt_token>
```

#### Response

```json
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "foodId": 1,
    "fotoMakanan": "<food_image_url>",
    "foodName": "Food Item",
    "description": "This is a food item",
    "quantity": 5,
    "location": "Food Bank",
    "latitude": "123.456",
    "longitude": "789.012",
    "expiredAt": "2023-06-30",
    "foodType": "Vegetarian"
  },
  {
    "foodId": 2,
    "fotoMakanan": "<food_image_url>",
    "foodName": "Another Item",
    "description": "This is another item",
    "quantity": 3,
    "location": "Food Pantry",
    "latitude": "345.678",
    "longitude": "901.234",
    "expiredAt": "2023-07-15",
    "foodType": "Non-vegetarian"
  }
]
```

---

## Viewing Food Details

### Get details of a specific food donation

Endpoint: `/foodDetail/:id` (GET)

Retrieve details of a specific food donation identified by its food ID.

#### Request

```json
GET /foodDetail/1
Authorization: Bearer <jwt_token>
```

#### Response

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "foodId": 1,
  "fotoMakanan": "<food_image_url>",
  "foodName": "Food Item",
  "description": "This is a food item",
  "quantity": 5,
  "location": "Food Bank",
  "latitude": "123.456",
  "longitude": "789.012",
  "expiredAt": "2023-06-30",
  "foodType": "Vegetarian"
}
```

---

## Viewing User Profile

### Get user profile details

Endpoint: `/userProfile` (GET)

Retrieve the profile details of the currently logged-in user.

#### Request

```json
GET /userProfile
Authorization: Bearer <jwt_token>
```

#### Response

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "userId": 1,
  "name": "John Doe",
  "email": "john.doe@example.com",
  "location": "City",
  "fotoProfile": "<profile_image_url>",
  "historyDonation": "Food Item - 11-06-2023"
}
```

---

## Updating User Profile

### Update user profile details

Endpoint: `/userProfile` (PUT)

Update the profile details of the currently logged-in user, including the location and profile photo.

#### Request

```json
PUT /userProfile
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

{
 

 "location": "New Location"
}

--file
Content-Disposition: form-data; name="fotoProfile"; filename="profile_image.jpg"
Content-Type: image/jpeg

<binary_file_data>
```

#### Response

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "User profile updated successfully"
}
```

---

## Viewing Donation History

### Get the donation history of a user

Endpoint: `/history` (GET)

Retrieve the donation history of the currently logged-in user.

#### Request

```json
GET /history
Authorization: Bearer <jwt_token>
```

#### Response

```json
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "historyId": 1,
    "userId_peminat": 1,
    "foodId": 1,
    "userId_donatur": 2,
    "status": true
  },
  {
    "historyId": 2,
    "userId_peminat": 1,
    "foodId": 2,
    "userId_donatur": 3,
    "status": false
  }
]
```

---

## Creating Donation History

### Create a new donation history

Endpoint: `/history` (POST)

Create a new donation history entry by providing the user ID of the recipient, food ID, donor user ID, and donation status.

#### Request

```json
POST /history
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "userId_peminat": 1,
  "foodId": 1,
  "userId_donatur": 2,
  "status": true
}
```

#### Response

```json
HTTP/1.1 201 Created
Content-Type: application/json

{
  "message": "Berhasil request makanan"
}
```

---

## Updating Donation History

### Update the status of a donation history entry

Endpoint: `/history/:id` (PUT)

Update the status of a specific donation history entry identified by its history ID.

#### Request

```json
PUT /history/1
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "status": false
}
```

#### Response

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Makanan telah dibagikan ke 1"
}
```

---
