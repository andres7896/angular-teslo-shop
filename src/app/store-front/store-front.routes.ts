
import { Routes } from "@angular/router";

import { StroreFrontLayout } from "./layouts/strore-front-layout/strore-front-layout";
import { HomePage } from "./pages/home-page/home-page";
import { GenderPage } from "./pages/gender-page/gender-page";
import { ProductPage } from "./pages/product-page/product-page";
import { NotFoundPage } from "./pages/not-found-page/not-found-page";

export const storeFrontRoutes: Routes = [
  {
    path: '',
    component: StroreFrontLayout,
    children: [
      {
        path: '',
        component: HomePage
      },
      {
        path: 'gender/:gender',
        component: GenderPage
      },
      {
        path: 'product/:idSlug',
        component: ProductPage
      },
      {
        path: '**',
        component: NotFoundPage
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

export default storeFrontRoutes;
