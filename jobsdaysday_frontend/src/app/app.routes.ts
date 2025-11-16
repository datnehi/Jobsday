import { Company } from './models/company';
import { Routes } from '@angular/router';
import { DashboardComponent } from './views/public/dashboard/dashboard.component';
import { NotfoundComponent } from './views/notfound/notfound.component';
import { JobDetailComponent } from './views/public/job-detail/job-detail.component';
import { CompanyDetailComponent } from './views/public/company-detail/company-detail.component';
import { SavedJobComponent } from './views/candidate-features/job-manager/saved-job/saved-job.component';
import { CvManagerComponent } from './views/candidate-features/cv/cv-manager/cv-manager.component';
import { UploadCvComponent } from './views/candidate-features/cv/upload-cv/upload-cv.component';
import { AppliedHistoryComponent } from './views/candidate-features/job-manager/applied-history/applied-history.component';
import { ChangePasswordComponent } from './views/public/change-password/change-password.component';
import { HrViewProfileComponent } from './views/candidate-features/cv/hr-view-profile/hr-view-profile.component';
import { ApplyJobSuccessComponent } from './views/candidate-features/job-manager/apply-job-success/apply-job-success.component';
import { LoginComponent } from './views/auth/login/login.component';
import { RegisterComponent } from './views/auth/register/register.component';
import { roleGuard } from './guards/role.guard';
import { ListJobComponent } from './views/hr-features/job-posting/list-job/list-job.component';
import { authGuard } from './guards/auth.guard';
import { UpdateJobComponent } from './views/hr-features/job-posting/update-job/update-job.component';
import { CreateJobComponent } from './views/hr-features/job-posting/create-job/create-job.component';
import { ListCandidateAppliedComponent } from './views/hr-features/job-posting/list-candidate-applied/list-candidate-applied.component';
import { candidateAuthGuard } from './guards/candidate-auth.guard';
import { notAuthGuard } from './guards/not-auth.guard';
import { SearchCandiateComponent } from './views/hr-features/search-candidate/search-candiate/search-candiate.component';
import { PersonalInfoComponent } from './views/public/personal-info/personal-info.component';
import { CompanyManagerComponent } from './views/hr-features/company-manager/company-manager/company-manager.component';
import { isAdminCompanyGuard } from './guards/is-admin-company.guard';
import { ApproveMemberComponent } from './views/hr-features/company-manager/approve-member/approve-member.component';
import { CompanyInfoComponent } from './views/hr-features/company-manager/company-info/company-info.component';
import { UserManagerComponent } from './views/admin-features/account-manager/user-manager/user-manager.component';
import { homeRedirectGuard } from './guards/home-redirect.guard';
import { CandidateRelatedInfoComponent } from './views/admin-features/account-manager/candidate-related-info/candidate-related-info.component';
import { JobRelatedInfoComponent } from './views/admin-features/company-manager/job-related-info/job-related-info.component';
import { CompanyRelatedInfoComponent } from './views/admin-features/company-manager/company-related-info/company-related-info.component';
import { HrRelatedInfoComponent } from './views/admin-features/company-manager/hr-related-info/hr-related-info.component';
import { CompanyManagementComponent } from './views/admin-features/company-manager/company-management/company-management.component';
import { ChatComponent } from './views/chat/chat/chat.component';
import { AnalyticsDashboardComponent } from './views/admin-features/analytics/analytics-dashboard/analytics-dashboard.component';
import { AnalyticsHrComponent } from './views/hr-features/analytics/analytics-hr/analytics-hr.component';
import { ForgotPasswordComponent } from './views/auth/forgot-password/forgot-password.component';

export const routes: Routes = [
  { path: '', canActivate: [homeRedirectGuard], component: NotfoundComponent },
  { path: 'jobsday', component: DashboardComponent, canActivate: [candidateAuthGuard] },
  { path: 'login', component: LoginComponent, canActivate: [notAuthGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [notAuthGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [notAuthGuard] },
  { path: 'notfound', component: NotfoundComponent },
  { path: 'job/:id', component: JobDetailComponent, canActivate: [candidateAuthGuard] },
  { path: 'company-detail/:id', component: CompanyDetailComponent, canActivate: [candidateAuthGuard] },
  { path: 'personal-info', component: PersonalInfoComponent, canActivate: [authGuard] },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
  { path: 'apply-success/:id', component: ApplyJobSuccessComponent, canMatch: [roleGuard(['CANDIDATE'])] },
  { path: 'saved-jobs', component: SavedJobComponent, canMatch: [roleGuard(['CANDIDATE'])] },
  { path: 'quan-ly-cv', component: CvManagerComponent, canMatch: [roleGuard(['CANDIDATE'])] },
  { path: 'upload-cv', component: UploadCvComponent, canMatch: [roleGuard(['CANDIDATE'])] },
  { path: 'applied-history', component: AppliedHistoryComponent, canMatch: [roleGuard(['CANDIDATE'])] },
  { path: 'xem-ho-so', component: HrViewProfileComponent, canMatch: [roleGuard(['CANDIDATE'])] },
  { path: 'quan-ly-job', component: ListJobComponent, canMatch: [roleGuard(['HR'])] },
  { path: 'update-job/:id', component: UpdateJobComponent, canMatch: [roleGuard(['HR'])] },
  { path: 'create-job', component: CreateJobComponent, canMatch: [roleGuard(['HR'])] },
  { path: 'list-candidates-applied/:id', component: ListCandidateAppliedComponent, canMatch: [roleGuard(['HR'])] },
  { path: 'search-candidates', component: SearchCandiateComponent, canMatch: [roleGuard(['HR'])] },
  { path: 'company-manager', component: CompanyManagerComponent, canActivate: [isAdminCompanyGuard] },
  { path: 'approve-member', component: ApproveMemberComponent, canActivate: [isAdminCompanyGuard] },
  { path: 'company-info', component: CompanyInfoComponent, canActivate: [isAdminCompanyGuard] },
  { path: 'analytics-hr', component: AnalyticsHrComponent, canMatch: [roleGuard(['HR'])] },

  { path: 'user-manager', component: UserManagerComponent, canMatch: [roleGuard(['ADMIN'])] },
  { path: 'candidate/:id', component: CandidateRelatedInfoComponent, canMatch: [roleGuard(['ADMIN'])] },
  { path: 'job-related-info/:id', component: JobRelatedInfoComponent, canMatch: [roleGuard(['ADMIN'])] },
  { path: 'company-related-info/:id', component: CompanyRelatedInfoComponent, canMatch: [roleGuard(['ADMIN'])] },
  { path: 'hr-related-info/:id', component: HrRelatedInfoComponent, canMatch: [roleGuard(['ADMIN'])] },
  { path: 'company-management', component: CompanyManagementComponent, canMatch: [roleGuard(['ADMIN'])] },
  { path: 'analytics', component: AnalyticsDashboardComponent, canMatch: [roleGuard(['ADMIN'])] },

  { path: 'chat', component: ChatComponent, data: { layout: 'blank' }, canActivate: [authGuard] },

];

