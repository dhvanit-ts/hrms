import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import NotFoundPage from './pages/NotFoundPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import AuthLayout from './layouts/AuthLayout'
import RootLayout from './layouts/RootLayout'
import AppLayout from './layouts/AppLayout'
import FeedPage from './pages/FeedPage'
import * as React from 'react'
import SetupUserPage from './pages/SetupUserPage'
import PostPage from './pages/PostPage'
import ResetPassword from './pages/ResetPassword'
import EnterEmail from './pages/EnterEmail'
import OtpVerificationPage from './pages/OtpVerificationPage'
import PasswordRecoverySetup from './pages/PasswordRecoverySetup'
import PrivateAppLayout from './layouts/PrivateAppLayout'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import BookmarksPage from './pages/BookmarksPage'
import FeedbackPage from './pages/FeedbackPage'
import NotificationsPage from './pages/NotificationsPage'
import CollegePage from './pages/CollegePage'
import OAuthSetupPage from './pages/OAuthSetup'
import ServerBooting from './pages/ServerBooting'

// router
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // public routes
      {
        path: "feedback",
        element: <FeedbackPage />,
      },
      {
        path: "server-booting",
        element: <ServerBooting />,
      },
      {
        path: "",
        element: <AppLayout />,
        children: [
          {
            path: "p/:id",
            element: <PostPage />,
          },
          {
            path: "",
            element: <FeedPage />,
          },
          {
            path: "notifications",
            element: <NotificationsPage />,
          },
          {
            path: "college",
            element: <CollegePage />,
          },
          {
            path: "trending",
            element: <h1>Trending</h1>,
          },
          {
            path: "branch",
            children: [
              {
                path: ":branch",
                element: <FeedPage />,
              }
            ]
          },
          {
            path: "topic",
            children: [
              {
                path: ":topic",
                element: <FeedPage />,
              }
            ]
          },
          {
            path: "u",
            element: <PrivateAppLayout />,
            children: [
              {
                path: "profile",
                element: <ProfilePage />,
              },
              {
                path: "settings",
                element: <SettingsPage />,
              },
              {
                path: "bookmarks",
                element: <BookmarksPage />,
              },
            ]
          },
        ]
      },
      // auth routes
      {
        path: "auth",
        element: <AuthLayout />,
        children: [
          {
            path: "signin",
            element: <SignInPage />,
          },
          {
            path: "otp/:email",
            element: <OtpVerificationPage onFailedRedirect='/auth/signin' onVerifiedRedirect='/auth/setup' />,
          },
          {
            path: "setup/:email",
            element: <SetupUserPage />,
          },
          {
            path: "signup",
            element: <SignUpPage />,
          },
          {
            path: "password-recovery",
            element: <ResetPassword />,
          },
          {
            path: "password-recovery/setup/:email",
            element: <PasswordRecoverySetup />,
          },
          {
            path: "password-recovery/otp/:email",
            element: <OtpVerificationPage onFailedRedirect='/auth/password-recovery/enter-email' onVerifiedRedirect='/auth/password-recovery/setup' />,
          },
          {
            path: "password-recovery/enter-email",
            element: <EnterEmail />,
          },
          {
            path: "oauth/callback",
            element: <OAuthSetupPage />,
          },
        ],
      },
      {
        path: "*",
        element: <NotFoundPage />,
      }
    ]
  },
]);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)