
// router
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // public routes
      {
        path: "",
        element: <AppLayout />,
        children: [
          {
            path: "p/:id",
            element: <PostPage />,
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
        ]
      },
    ]
  },
]);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)