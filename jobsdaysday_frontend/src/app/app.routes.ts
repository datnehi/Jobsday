import { Routes } from '@angular/router';
import { DashboardComponent } from './views/public/dashboard/dashboard.component';
import { NotfoundComponent } from './views/notfound/notfound.component';
import { JobDetailComponent } from './views/public/job-detail/job-detail.component';
import { CompanyDetailComponent } from './views/public/company-detail/company-detail.component';
import { SavedJobComponent } from './views/candidate-features/job-manager/saved-job/saved-job.component';
import { CvManagerComponent } from './views/candidate-features/cv/cv-manager/cv-manager.component';
import { UploadCvComponent } from './views/candidate-features/cv/upload-cv/upload-cv.component';
import { AppliedHistoryComponent } from './views/candidate-features/job-manager/applied-history/applied-history.component';
import { ChangePasswordComponent } from './views/candidate-features/personal/change-password/change-password.component';
import { HrViewProfileComponent } from './views/candidate-features/cv/hr-view-profile/hr-view-profile.component';
import { ApplyJobSuccessComponent } from './views/candidate-features/job-manager/apply-job-success/apply-job-success.component';
import { PersonalInfoComponent } from './views/candidate-features/personal/personal-info/personal-info.component';
import { LoginComponent } from './views/auth/login/login.component';
import { RegisterComponent } from './views/auth/register/register.component';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent},
  { path: 'login', component: LoginComponent,},
  { path: 'register', component: RegisterComponent,},
  { path: 'notfound', component: NotfoundComponent},
  { path: 'job/:id', component: JobDetailComponent},
  { path: 'company-detail/:id', component: CompanyDetailComponent },
  { path: 'apply-success/:id', component: ApplyJobSuccessComponent, canMatch: [roleGuard(['CANDIDATE'])] },
  { path: 'saved-jobs', component: SavedJobComponent, canMatch: [roleGuard(['CANDIDATE'])] },
  { path: 'quan-ly-cv', component: CvManagerComponent, canMatch: [roleGuard(['CANDIDATE'])] },
  { path: 'upload-cv', component: UploadCvComponent, canMatch: [roleGuard(['CANDIDATE'])] },
  { path: 'applied-history', component: AppliedHistoryComponent, canMatch: [roleGuard(['CANDIDATE'])] },
  { path: 'personal-info', component: PersonalInfoComponent, canMatch: [roleGuard(['CANDIDATE'])] },
  { path: 'change-password', component: ChangePasswordComponent, canMatch: [roleGuard(['CANDIDATE'])] },
  { path: 'xem-ho-so', component: HrViewProfileComponent, canMatch: [roleGuard(['CANDIDATE'])] }

];

