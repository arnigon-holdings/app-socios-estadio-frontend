import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
      allowGuestAccess: true,
    }
  }
});
