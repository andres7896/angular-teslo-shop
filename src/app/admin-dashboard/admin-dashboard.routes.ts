import { Routes } from '@angular/router';

import { isAdminGuard } from '@/auth/guards/is-admin-guard';

import { ProductAdminPage } from './pages/product-admin-page/product-admin-page';
import { ProductsAdminPage } from './pages/products-admin-page/products-admin-page';
import { AdminDashboardLayout } from './layouts/admin-dashboard-layout/admin-dashboard-layout';

export const adminDashboardRoutes: Routes = [
  {
    path: '',
    component: AdminDashboardLayout,
    canMatch: [
      isAdminGuard
    ],
    children: [
      {
        path: 'products',
        component: ProductsAdminPage
      },
      {
        path: 'products/:id',
        component: ProductAdminPage
      },
      {
        path: '**',
        redirectTo: 'products'
      }
    ]
  }
];

export default adminDashboardRoutes;
