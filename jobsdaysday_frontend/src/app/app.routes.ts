import { Routes } from '@angular/router';
import { LoginComponent } from './views/login/login.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { NotfoundComponent } from './views/notfound/notfound.component';
import { authGuard } from './guards/auth.guard';
import { RegisterComponent } from './views/register/register.component';
import { JobDetailComponent } from './views/job-detail/job-detail.component';
import { ApplyJobSuccessComponent } from './views/apply-job-success/apply-job-success.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent},
  { path: 'login', component: LoginComponent,},
  { path: 'register', component: RegisterComponent,},
  { path: 'notfound', component: NotfoundComponent},
  { path: 'job/:id', component: JobDetailComponent},
  { path: 'apply-success/:id', component: ApplyJobSuccessComponent, canActivate: [authGuard] },
];

