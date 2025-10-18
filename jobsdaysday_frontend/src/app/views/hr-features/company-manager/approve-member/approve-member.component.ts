import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CompanyMemberService } from '../../../../services/company-member.service';
import { NotificationDialogComponent } from "../../../common/notification-dialog/notification-dialog.component";
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";
import { LoadingComponent } from "../../../common/loading/loading.component";
import { CompanyMember } from '../../../../models/company_member';

@Component({
  selector: 'app-approve-member',
  imports: [
    CommonModule,
    NotificationDialogComponent,
    ErrorDialogComponent,
    LoadingComponent
  ],
  templateUrl: './approve-member.component.html',
  styleUrls: ['./approve-member.component.css']
})
export class ApproveMemberComponent {
  requests: any[] = [];
  currentPage: number = 0;
  totalPages: number = 1;
  isLoading: boolean = false;
  showConfirmDialog: boolean = false;
  confirmTitle: string = '';
  confirmMessage: string = '';
  errorTitle: string = '';
  errorMessage: string = '';
  showErrorDialog: boolean = false;
  confirmAction: 'approve' | 'reject' | null = null;

  editMemberData: CompanyMember | null = null;

  constructor(private companyMemberService: CompanyMemberService) { }

  ngOnInit() {
    this.loadMemberRequests();
  }

  loadMemberRequests(page: number = 0) {
    this.isLoading = true;
    const filters = {
      page: page,
    };
    this.companyMemberService.getMemberRequests(filters).subscribe(
      (response) => {
        if (response && response.data) {
          this.requests = response.data.content;
          this.totalPages = response.data.totalPages;
          this.currentPage = response.data.page;
          this.isLoading = false;
        }
        this.isLoading = false;
      },
      (error) => {
        this.isLoading = false;
        this.errorTitle = 'Lỗi';
        this.errorMessage = 'Không thể tải danh sách yêu cầu.';
        this.showErrorDialog = true;
      }
    );
  }

  changePage(page: number) {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadMemberRequests(page);
    }
  }

  handleCancel() {
    this.showConfirmDialog = false;
  }

  handleCancelError() {
    this.showErrorDialog = false;
  }

  handleConfirm() {
    this.showConfirmDialog = false;
    this.saveMember();
  }

  openConfirm(action: 'approve' | 'reject') {
    this.confirmAction = action;
    this.confirmTitle = 'Xác nhận';
    this.confirmMessage = action === 'approve'
      ? 'Bạn có chắc chắn muốn duyệt thành viên này?'
      : 'Bạn có chắc chắn muốn từ chối thành viên này?';
    this.showConfirmDialog = true;
  }

  saveMember() {
    if (!this.editMemberData) return;
    this.showConfirmDialog = false;
    this.isLoading = true;
    this.companyMemberService.updateMember(this.editMemberData).subscribe(response => {
      if (response && response.data) {
        this.isLoading = false;
        this.requests = this.requests.filter(req => req.id !== this.editMemberData!.id);
      } else {
        this.isLoading = false;
        this.errorTitle = 'Lỗi';
        this.errorMessage = 'Cập nhật thành viên thất bại.';
        this.showErrorDialog = true;
      }
      this.isLoading = false;
    });
  }

  confirmMember(memberId: number, action: 'approve' | 'reject') {
    this.companyMemberService.getMemberById(memberId).subscribe(response => {
      if (response && response.data) {
        this.editMemberData = response.data;
        if (this.editMemberData) {
          this.editMemberData!.status = action === 'approve' ? 'APPROVED' : 'REJECTED';
          this.openConfirm(action);
        }
      }
    });
  }

}
