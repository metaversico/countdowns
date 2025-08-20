# Social Authentication (v1) RFC

This document outlines the proposal for adding social authentication to the countdown application.

- **Objective:** Introduce social authentication to allow users to create and manage their countdowns.
- **Tradeoffs:** Analyze different authentication strategies and select the most appropriate one for the existing tech stack.
- **Data flow:** Detail the end-to-end process of user authentication and countdown management.
- **Testability:** Define the testing strategy to ensure the reliability of the new feature.

## Objective

The primary goal of this feature is to allow users to authenticate using their social media accounts (initially X/Twitter, with the possibility of adding Google and Facebook later). This will provide a more personalized experience and enable new features, such as:

- **Authenticated Countdowns:** Displaying the creator's profile information on the countdown page.
- **User-specific Countdown Management:** Allowing users to view and delete their own countdowns.
- **Anonymous Countdowns:** Users can still create anonymous countdowns without logging in.

### User Stories

- As a user, I want to be able to log in with my X/Twitter account to create a countdown.
- As a user, I want my social profile to be linked on the countdowns I create.
- As a user, I want to be able to delete the countdowns I have created.
- As a user, I should still be able to create an anonymous countdown without logging in.

## Tradeoffs

We need to decide on an authentication mechanism. The two main options are session-based authentication and token-based authentication (JWT).

- **Session-based authentication:**
    - **Pros:** Simpler to implement for basic use cases. State is managed on the server.
    - **Cons:** Less scalable, as it requires server-side storage for session data. Can be more complex to manage in a stateless API architecture.

- **Token-based authentication (JWT):**
    - **Pros:** Stateless, scalable, and well-suited for APIs. The JWT can contain user information, reducing the need for database lookups.
    - **Cons:** Can be more complex to implement initially. JWTs need to be stored securely on the client-side.

### Recommendation

Given our Deno-based backend with a stateless API design, **JWT-based authentication is the recommended approach**. We can use a library like `hono/jwt` to simplify the implementation. This will allow us to create a secure and scalable authentication system.

For the frontend, we will use a library like `universal-cookie` to manage the JWT cookie.

## Data flow

### Authentication Flow

1.  **User Initiates Login:** The user clicks a "Login with X/Twitter" button on the frontend.
2.  **Frontend Redirects to Backend:** The frontend redirects the user to a backend endpoint (e.g., `/auth/twitter`).
3.  **Backend Initiates OAuth Flow:** The backend initiates the OAuth 2.0 flow with X/Twitter.
4.  **User Authorizes:** The user is redirected to X/Twitter to authorize the application.
5.  **X/Twitter Redirects to Backend:** After authorization, X/Twitter redirects the user back to a callback URL on our backend (e.g., `/auth/twitter/callback`) with an authorization code.
6.  **Backend Exchanges Code for Token:** The backend exchanges the authorization code for an access token from X/Twitter.
7.  **Backend Fetches User Profile:** The backend uses the access token to fetch the user's profile information from the X/Twitter API.
8.  **Backend Creates User Record:** The backend creates or updates a user record in the database with the user's social profile information.
9.  **Backend Generates JWT:** The backend generates a JWT containing the user's ID.
10. **Backend Sets Cookie and Redirects:** The backend sets the JWT as an HTTP-only cookie and redirects the user back to the frontend application.
11. **Frontend Stores JWT:** The frontend now has the JWT stored in a cookie, and the user is authenticated.

### Data Model Changes

We will introduce a new `User` type and update the `Countdown` type.

**User Type:**

```typescript
export interface User {
  id: string; // e.g., 'twitter:123456789'
  provider: 'twitter' | 'google' | 'facebook';
  providerId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  createdAt: string; // ISO date
}
```

**Countdown Type Update:**

The `Countdown` type will be updated to include an optional `userId` field.

```typescript
export interface Countdown extends CountdownInput {
  id: string;
  createdAt: string; // ISO date
  userId?: string; // Foreign key to the User
}
```

### API Endpoint Changes

- **`POST /countdowns`**:
    - If the user is authenticated (i.e., a valid JWT is present), the `userId` will be extracted from the token and associated with the new countdown.
    - If the user is not authenticated, the countdown will be created anonymously (`userId` will be `null`).

- **`DELETE /countdowns/:id`**:
    - This endpoint will require authentication.
    - The backend will verify that the `userId` in the JWT matches the `userId` of the countdown before deleting it.

- **`GET /auth/twitter`**: Initiates the Twitter OAuth flow.
- **`GET /auth/twitter/callback`**: Handles the callback from Twitter.
- **`GET /auth/logout`**: Clears the authentication cookie.
- **`GET /users/me`**: Returns the currently authenticated user's profile.

## Testability

### Backend

- **Unit Tests:**
    - Test the JWT generation and validation logic.
    - Test the OAuth callback handler logic.
    - Test the new API endpoints (`/auth/*`, `/users/me`).
    - Test the updated `POST /countdowns` and `DELETE /countdowns/:id` endpoints to ensure they handle authenticated and unauthenticated requests correctly.

- **Integration Tests:**
    - Test the full OAuth flow with a mocked Twitter API.
    - Test the interaction between the authentication middleware and the countdown routes.

### Frontend

- **Unit Tests:**
    - Test the components related to authentication (e.g., Login button, user profile display).
    - Test the logic for handling the authentication state (e.g., showing/hiding elements based on whether the user is logged in).

- **End-to-End (E2E) Tests:**
    - Use a testing framework like Playwright or Cypress to test the entire login flow.
    - Test creating an authenticated countdown.
    - Test deleting a countdown.

This RFC provides a comprehensive plan for implementing social authentication. By following this plan, we can build a secure, scalable, and user-friendly authentication system that enhances the functionality of the countdown application.
