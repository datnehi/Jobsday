import { Routes } from '@angular/router';
import { LoginComponent } from './views/login/login.component';
import { DashboardComponent } from './views/dashboard/dashboard.component';
import { NotfoundComponent } from './views/notfound/notfound.component';
import { authGuard } from './guards/auth.guard';
import { RegisterComponent } from './views/register/register.component';
import { JobDetailComponent } from './views/job-detail/job-detail.component';
import { ApplyJobSuccessComponent } from './views/apply-job-success/apply-job-success.component';
import { CompanyDetailComponent } from './views/company-detail/company-detail.component';
import { SavedJobComponent } from './views/saved-job/saved-job.component';
import { CvManagerComponent } from './views/cv-manager/cv-manager.component';
import { UploadCvComponent } from './views/upload-cv/upload-cv.component';
import { AppliedHistoryComponent } from './views/applied-history/applied-history.component';
import { PersonalInfoComponent } from './views/personal-info/personal-info.component';
import { ChangePasswordComponent } from './views/change-password/change-password.component';
import { HrViewProfileComponent } from './views/hr-view-profile/hr-view-profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent},
  { path: 'login', component: LoginComponent,},
  { path: 'register', component: RegisterComponent,},
  { path: 'notfound', component: NotfoundComponent},
  { path: 'job/:id', component: JobDetailComponent},
  { path: 'apply-success/:id', component: ApplyJobSuccessComponent, canActivate: [authGuard] },
  { path: 'saved-jobs', component: SavedJobComponent, canActivate: [authGuard] },
  { path: 'quan-ly-cv', component: CvManagerComponent, canActivate: [authGuard] },
  { path: 'upload-cv', component: UploadCvComponent, canActivate: [authGuard] },
  { path: 'applied-history', component: AppliedHistoryComponent, canActivate: [authGuard] },
  { path: 'company-detail/:id', component: CompanyDetailComponent },
  { path: 'personal-info', component: PersonalInfoComponent, canActivate: [authGuard] },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
  { path: 'xem-ho-so', component: HrViewProfileComponent, canActivate: [authGuard] }

];

