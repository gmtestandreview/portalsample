import { Outlet } from 'react-router';
import AuthenticatedElement from '../authentication/AuthenticatedElement';

export default function AuthenticatedHeaderlessLayout() {
  return (
    <AuthenticatedElement displayHeaderAndFooter={false}>
      <Outlet />
    </AuthenticatedElement>
  );
}
