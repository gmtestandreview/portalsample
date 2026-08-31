import { RouterProvider } from 'react-router';
import { DemoAuthProvider } from './portal/auth/DemoAuthProvider';
import { createPortalBrowserRouter } from './portal/routing/PortalRouter';

const portalRouter = createPortalBrowserRouter();

function App() {
  return (
    <DemoAuthProvider>
      <RouterProvider router={portalRouter} />
    </DemoAuthProvider>
  );
}

export default App;
