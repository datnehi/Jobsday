import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Company } from '../../../../models/company';
import { CompanyService } from '../../../../services/company.service';
import { ConvertEnumService } from '../../../../services/common/convert-enum.service';
import { NewlineToBrPipe } from "../../../../services/common/newline-to-br-pipe.service";
import { RouterModule } from '@angular/router';
import { NotificationDialogComponent } from "../../../common/notification-dialog/notification-dialog.component";
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";
import { LoadingComponent } from "../../../common/loading/loading.component";
import { finalize } from 'rxjs';

@Component({
  selector: 'app-company-management',
  imports: [
    CommonModule,
    FormsModule,
    NewlineToBrPipe,
    RouterModule,
    ReactiveFormsModule,
    NotificationDialogComponent,
    ErrorDialogComponent,
    LoadingComponent
  ],
  templateUrl: './company-management.component.html',
  styleUrl: './company-management.component.css'
})
export class CompanyManagementComponent {
  activeTab: 'list' | 'pending' = 'list';

  companies: Company[] = [];
  activeCurrentPage = 0;
  activeTotalPages = 0;
  activeSearchText = '';
  pendingActiveSearchText = '';
  pendingCompanies: Company[] = [];
  pendingCount = 0;
  showLocationDropdown = false;
  locations = [
    { value: '', label: 'Tất cả' },
    { value: 'Hà Nội', label: 'Hà Nội' },
    { value: 'Hồ Chí Minh', label: 'Hồ Chí Minh' },
    { value: 'Đà Nẵng', label: 'Đà Nẵng' }
  ];
  selectedLocation = '';
  showCompanyDetail = false;
  selectedCompany: Company = {} as Company;
  isDescExpanded = false;
  companyForm!: FormGroup;
  showEditCompanyModal = false;
  showConfirmDialog = false;
  confirmAction: 'editCompany' | 'cancelEditCompany' | 'deleteCompany' | 'approveCompany' | 'rejectCompany' | null = null;
  confirmTitle = '';
  confirmMessage = '';
  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';
  isLoading = false;
  showPendingLocationDropdown = false;
  pendingSelectedLocation = '';
  pendingTotalPages = 1;
  pendingCurrentPage = 0;
  pendingSearchText = '';
  pendingPendingSearchText = '';

  constructor(
    private companyService: CompanyService,
    private convertEnumService: ConvertEnumService,
    private fb: FormBuilder,
  ) {
    this.companyForm = this.fb.group({
      name: ['', Validators.required],
      location: ['', Validators.required],
      address: [''],
      website: [''],
      taxCode: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      description: [''],
      status: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCompanies();
    this.loadPendingCompanies();
  }

  setTab(tab: 'list' | 'pending') {
    this.activeTab = tab;
    if (tab === 'list') this.loadCompanies();
    else this.loadPendingCompanies();
  }

  loadCompanies(page: number = 0) {
    const filter = {
      text: this.activeSearchText,
      location: this.convertEnumService.mapLocationToEnum(this.selectedLocation),
      page
    };
    this.isLoading = true;
    this.companyService.getAll(filter)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe(response => {
        this.companies = (response.data.content || []).map((c: Company) => {
          return {
            ...c,
            location: this.convertEnumService.mapLocationFromEnum(c.location)
          };
        });
        this.activeCurrentPage = response.data.page;
        this.activeTotalPages = response.data.totalPages;
        this.pendingActiveSearchText = this.activeSearchText;
      });
  }

  loadPendingCompanies(page: number = 0) {
    const filter = {
      text: this.pendingSearchText,
      location: this.convertEnumService.mapLocationToEnum(this.pendingSelectedLocation),
      page
    };
    this.isLoading = true;
    this.companyService.getAllPending(filter)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe(response => {
        this.pendingCompanies = (response.data.content || []).map((c: Company) => {
          return {
            ...c,
            location: this.convertEnumService.mapLocationFromEnum(c.location)
          };
        });
        this.pendingCurrentPage = response.data.page;
        this.pendingTotalPages = response.data.totalPages;
        this.pendingPendingSearchText = this.pendingSearchText;
      });
  }

  searchCompanies() {
    this.loadCompanies(0);
  }

  openDetail(company: any) {
    this.selectedCompany = company;
    this.showCompanyDetail = true;
  }

  closeCompanyDetail() {
    this.showCompanyDetail = false;
    this.selectedCompany = {} as Company;
  }

  editCompany(c: Company) {
    this.selectedCompany = c;
    this.showEditCompanyModal = true;
    this.companyForm.patchValue({
      name: c.name,
      location: c.location,
      address: c.address,
      website: c.website,
      taxCode: c.taxCode,
      email: c.email,
      description: c.description,
      status: c.status
    });
  }

  approve() {
    this.isLoading = true;
    const updatedCompany: Company = {
      ...this.selectedCompany,
      location: this.convertEnumService.mapLocationToEnum(this.selectedCompany.location) || '',
      status: 'APPROVED'
    };

    this.companyService.update(updatedCompany)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: () => {
          this.showCompanyDetail = false;
          this.selectedCompany = {} as Company;
          this.loadPendingCompanies();
        },
        error: (error) => {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Đã xảy ra lỗi khi cập nhật thông tin công ty.';
          this.showErrorDialog = true;
        }
      });
  }

  reject() {
    this.isLoading = true;
    const updatedCompany: Company = {
      ...this.selectedCompany,
      location: this.convertEnumService.mapLocationToEnum(this.selectedCompany.location) || '',
      status: 'REJECTED'
    };

    this.companyService.update(updatedCompany)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: () => {
          this.showCompanyDetail = false;
          this.selectedCompany = {} as Company;
          this.loadPendingCompanies();
        },
        error: (error) => {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Đã xảy ra lỗi khi cập nhật thông tin công ty.';
          this.showErrorDialog = true;
        }
      });
  }

  changePage(page: number) {
    if (this.pendingActiveSearchText !== this.activeSearchText) {
      this.loadCompanies(0);
    } else if (page >= 0 && page < this.activeTotalPages) {
      this.loadCompanies(page);
    }
  }

  onLocationChange(location: string) {
    this.selectedLocation = location;
    this.showLocationDropdown = false;
    this.loadCompanies(0);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    this.showLocationDropdown = false;
  }

  toggleDesc() {
    this.isDescExpanded = !this.isDescExpanded;
  }

  openConfirm(action: 'editCompany' | 'cancelEditCompany' | 'deleteCompany' | 'approveCompany' | 'rejectCompany', company?: Company) {
    this.confirmAction = action;
    if (action === 'editCompany') {
      this.confirmTitle = 'Xác nhận thay đổi công ty';
      this.confirmMessage = 'Bạn có chắc chắn muốn lưu thay đổi cho công ty này không?';
    } else if (action === 'cancelEditCompany') {
      this.confirmTitle = 'Hủy thay đổi công ty';
      this.confirmMessage = 'Bạn có chắc chắn muốn hủy các thay đổi không? Mọi thay đổi chưa lưu sẽ bị mất.';
    } else if (action === 'deleteCompany') {
      this.selectedCompany = company!;
      this.confirmTitle = 'Xóa công ty';
      this.confirmMessage = 'Bạn có chắc chắn muốn xóa công ty này không? Hành động này không thể hoàn tác.';
    } else if (action === 'approveCompany') {
      if (company) this.selectedCompany = company;
      this.confirmTitle = 'Duyệt công ty';
      this.confirmMessage = 'Bạn có chắc chắn muốn duyệt công ty này không?';
    } else if (action === 'rejectCompany') {
      if (company) this.selectedCompany = company;
      this.confirmTitle = 'Từ chối công ty';
      this.confirmMessage = 'Bạn có chắc chắn muốn từ chối công ty này không?';
    }
    this.showConfirmDialog = true;
  }

  handleConfirm() {
    if (this.confirmAction === 'editCompany') {
      this.saveEditCompany();
    } else if (this.confirmAction === 'cancelEditCompany') {
      this.closeEditCompanyModal();
    } else if (this.confirmAction === 'deleteCompany') {
      this.onDeleteCompany(this.selectedCompany.id);
    } else if (this.confirmAction === 'approveCompany') {
      this.approve();
    } else if (this.confirmAction === 'rejectCompany') {
      this.reject();
    }
    this.showConfirmDialog = false;
    this.confirmAction = null;
  }

  closeEditCompanyModal() {
    this.showEditCompanyModal = false;
    this.companyForm.reset();
    this.selectedCompany = {} as Company;
  }

  handleCancel() {
    this.showConfirmDialog = false;
    this.confirmAction = null;
  }

  handleCancelError() {
    this.showErrorDialog = false;
  }

  saveEditCompany() {
    if (this.companyForm.invalid) {
      this.errorTitle = 'Lỗi';
      this.errorMessage = 'Vui lòng điền đầy đủ các trường bắt buộc.';
      this.showErrorDialog = true;
      return;
    }
    this.isLoading = true;
    const updatedCompany: Company = {
      ...this.selectedCompany,
      ...this.companyForm.value,
      location: this.convertEnumService.mapLocationToEnum(this.companyForm.get('location')?.value)
    };

    this.companyService.update(updatedCompany)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: () => {
          this.showEditCompanyModal = false;
          this.selectedCompany = {} as Company;
          this.companyForm.reset();
          this.ngOnInit();
        },
        error: (error) => {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Đã xảy ra lỗi khi cập nhật thông tin công ty.';
          this.showErrorDialog = true;
        }
      });
  }

  onDeleteCompany(companyId: number) {
    this.isLoading = true;
    this.companyService.deleteCompany(companyId)
      .pipe(finalize(() => { this.isLoading = false; }))
      .subscribe({
        next: (response) => {
          if (response.status === 200) {
            this.selectedCompany = {} as Company;
            this.loadCompanies();
          }
        },
        error: (error) => {
          this.errorTitle = 'Lỗi';
          this.errorMessage = 'Đã xảy ra lỗi khi xóa công ty.';
          this.showErrorDialog = true;
        }
      });
  }

  onPendingLocationChange(location: string) {
    this.pendingSelectedLocation = location;
    this.showPendingLocationDropdown = false;
    this.loadPendingCompanies();
  }

  changePendingPage(page: number) {
    if (this.pendingSearchText !== this.pendingPendingSearchText) {
      this.loadPendingCompanies();
    } else if (page >= 0 && page < this.pendingTotalPages) {
      this.loadPendingCompanies();
    }
  }
}
