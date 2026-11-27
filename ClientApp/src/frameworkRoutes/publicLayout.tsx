import { Outlet } from 'react-router';
import Layout from '../components/Layout';

export default function PublicLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
