import { Outlet } from 'react-router';
import AuthenticatedElement from '../authentication/AuthenticatedElement';

export default function AuthenticatedLayout() {
  return (
    <AuthenticatedElement>
      <Outlet />
    </AuthenticatedElement>
  );
}
