# API Documentation

This documentation provides an overview of the API endpoints and their functionalities for the project.

## Table of Contents
- [Authentication](#authentication)
  - [Register](#register)
  - [Login](#login)
- [User](#user)
  - [Get User Profile](#get-user-profile)
  - [Update User Profile](#update-user-profile)
- [Food Donation](#food-donation)
  - [Post Food Donation](#post-food-donation)
  - [Get Available Food List](#get-available-food-list)
  - [Get Food Details](#get-food-details)
- [History](#history)
  - [Get User History](#get-user-history)
  - [Create History](#create-history)
  - [Update History](#update-history)

## Authentication

### Register

Create a new user account.

- **URL**: `/register`
- **Method**: `POST`
- **Request Body**:
  - `name` (required): Name of the user.
  - `email` (required): Email address of the user.
  - `password` (required): Password for the user account.
- **Response**:
  - `message`: Success message if the user is created successfully.
- **Error Response**:
  - Status: 400 Bad Request
  - Content: JSON object with the `errors` field containing an array of validation errors.

### Login

Authenticate a user and obtain an access token.

- **URL**: `/login`
- **Method**: `POST`
- **Request Body**:
  - `email` (required): Email address of the user.
  - `password` (required): Password for the user account.
- **Response**:
  - `userId`: ID of the authenticated user.
  - `name`: Name of the authenticated user.
  - `email`: Email address of the authenticated user.
  - `token`: JWT access token for authenticating subsequent requests.
- **Error Response**:
  - Status: 400 Bad Request
  - Content: JSON object with the `errors` field containing an array of validation errors.

## User

### Get User Profile

Retrieve the profile details of the authenticated user.

- **URL**: `/userProfile`
- **Method**: `GET`
- **Request Headers**:
  - `Authorization`: Bearer token obtained from the login.
- **Response**:
  - `userId`: ID of the user.
  - `name`: Name of the user.
  - `email`: Email address of the user.
  - `location`: User's location.
  - `fotoProfile`: URL of the user's profile photo.
  - `historyDonation`: User's donation history.

### Update User Profile

Update the profile details of the authenticated user.

- **URL**: `/userProfile`
- **Method**: `PUT`
- **Request Headers**:
  - `Authorization`: Bearer token obtained from the login.
- **Request Body**:
  - `location` (required): User's location.
  - `fotoProfile`: Profile photo file to upload (multipart/form-data).
- **Response**:
  - `message`: Success message if the user profile is updated successfully.
- **Error Response**:
  - Status: 400 Bad Request
  - Content: JSON object with the `error` field containing the error message.

## Food Donation

### Post Food Donation

Create a new food donation entry.

- **URL**: `/postFood`
- **Method**: `POST`
- **Request Headers**:
  - `Authorization`: Bearer token obtained from the login.
- **Request Body**:
  - `foodName` (required): Name of the donated food.


  - `description` (required): Description of the donated food.
  - `quantity` (required): Quantity of the donated food.
  - `location` (required): Location of the donated food.
  - `expiredAt` (required): Expiration date of the donated food (DD-MM-YYYY format).
  - `foodType` (required): Type of the donated food.
  - `fotoMakanan` (required): Food photo file to upload (multipart/form-data).
- **Response**:
  - `message`: Success message if the food donation is posted successfully.
- **Error Response**:
  - Status: 400 Bad Request
  - Content: JSON object with the `errors` field containing an array of validation errors.

### Get Available Food List

Retrieve the list of available food donations.

- **URL**: `/foodList`
- **Method**: `GET`
- **Request Headers**:
  - `Authorization`: Bearer token obtained from the login.
- **Response**:
  - Array of food donation objects with the following fields:
    - `foodId`: ID of the food donation.
    - `fotoMakanan`: URL of the food photo.
    - `foodName`: Name of the donated food.
    - `description`: Description of the donated food.
    - `quantity`: Quantity of the donated food.
    - `location`: Location of the donated food.
    - `latitude`: Latitude coordinate of the donated food location.
    - `longitude`: Longitude coordinate of the donated food location.
    - `expiredAt`: Expiration date of the donated food.
    - `foodType`: Type of the donated food.

### Get Food Details

Retrieve the details of a specific food donation.

- **URL**: `/foodDetail/:id`
- **Method**: `GET`
- **Request Headers**:
  - `Authorization`: Bearer token obtained from the login.
- **URL Parameters**:
  - `id`: ID of the food donation.
- **Response**:
  - Object with the following fields:
    - `foodId`: ID of the food donation.
    - `fotoMakanan`: URL of the food photo.
    - `foodName`: Name of the donated food.
    - `description`: Description of the donated food.
    - `quantity`: Quantity of the donated food.
    - `location`: Location of the donated food.
    - `latitude`: Latitude coordinate of the donated food location.
    - `longitude`: Longitude coordinate of the donated food location.
    - `expiredAt`: Expiration date of the donated food.
    - `foodType`: Type of the donated food.
- **Error Response**:
  - Status: 404 Not Found
  - Content: JSON object with the `error` field containing the error message.

## History

### Get User History

Retrieve the donation history of the authenticated user.

- **URL**: `/history`
- **Method**: `GET`
- **Request Headers**:
  - `Authorization`: Bearer token obtained from the login.
- **Response**:
  - Array of history objects with the following fields:
    - `historyId`: ID of the history entry.
    - `userId_peminat`: ID of the user who requested the food.
    - `foodId`: ID of the donated food.
    - `userId_donatur`: ID of the user who donated the food.
    - `status`: Status of the history entry (true if the food has been distributed).

### Create History

Create a new history entry.

- **URL**: `/history`
- **Method**: `POST`
- **Request Headers**:
  - `Authorization`: Bearer token obtained from the login.
- **Request Body**

:
  - `userId_peminat` (required): ID of the user who requested the food.
  - `foodId` (required): ID of the donated food.
  - `userId_donatur` (required): ID of the user who donated the food.
  - `status` (required): Status of the history entry (true if the food has been distributed).
- **Response**:
  - `message`: Success message if the history entry is created successfully.
- **Error Response**:
  - Status: 500 Internal Server Error
  - Content: JSON object with the `error` field containing the error message.

### Update History

Update the status of a history entry.

- **URL**: `/history/:id`
- **Method**: `PUT`
- **Request Headers**:
  - `Authorization`: Bearer token obtained from the login.
- **URL Parameters**:
  - `id`: ID of the history entry.
- **Request Body**:
  - `status` (required): Updated status of the history entry (true if the food has been distributed).
- **Response**:
  - `message`: Success message if the history entry is updated successfully.
- **Error Response**:
  - Status: 500 Internal Server Error
  - Content: JSON object with the `error` field containing the error message.

## Error Handling

If an error occurs during the API requests, the server will respond with a JSON object containing the `error` field and an appropriate error message.

Example Error Response:
```json
{
  "error": "Internal server error"
}
```
