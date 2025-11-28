import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CompanyMemberService } from '../../../../services/company-member.service';
import { CompanyMember } from '../../../../models/company_member';
import { NotificationDialogComponent } from "../../../common/notification-dialog/notification-dialog.component";
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";
import { LoadingComponent } from "../../../common/loading/loading.component";
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-company-manager',
  imports: [
    CommonModule,
    FormsModule,
    NotificationDialogComponent,
    ErrorDialogComponent,
    LoadingComponent,
    RouterModule
  ],
  templateUrl: './company-manager.component.html',
  styleUrls: ['./company-manager.component.css']
})
export class CompanyManagerComponent {
  searchText: string = '';
  currentPage: number = 0;
  totalPages: number = 1;
  members: any[] = [];
  isLoading: boolean = false;
  showConfirmDialog: boolean = false;
  confirmTitle: string = '';
  confirmMessage: string = '';
  errorTitle: string = '';
  errorMessage: string = '';
  showErrorDialog: boolean = false;
  confirmAction: 'save' | 'cancel' | null = null;

  showEditDialog = false;
  editMemberData: CompanyMember | null = null;
  email: string = '';
  fullName: string = '';
  pendingSearchText: string = '';

  constructor(
    private companyMemberService: CompanyMemberService
  ) { }

  ngOnInit() {
    this.featchMembers();
  }

  featchMembers(page: number = 0) {
    const filters = {
      textSearch: this.searchText,
      page: page,
    };
    this.companyMemberService.getMembers(filters).subscribe(response => {
      if (response && response.data) {
        this.members = response.data.content;
        this.totalPages = response.data.totalPages;
        this.currentPage = response.data.page;
        this.pendingSearchText = this.searchText;
      }
    });
  }

  removeMember(memberId: number) {
    this.companyMemberService.getMemberById(memberId).subscribe(response => {
      if (response && response.data) {
        this.editMemberData = response.data;
        if (this.editMemberData) {
          this.editMemberData!.status = 'REJECTED';
          this.openConfirm('save');
        }
      }
    });
  }

  changePage(page: number) {
    if (this.pendingSearchText !== this.searchText) {
      this.featchMembers(0);
    } else if (page >= 0 && page < this.totalPages) {
      this.featchMembers(page);
    }
  }

  editMember(member: any) {
    this.companyMemberService.getMemberById(member.id).subscribe(response => {
      if (response && response.data) {
        this.editMemberData = response.data;
        this.email = member.email;
        this.fullName = member.fullName;
        this.showEditDialog = true;
      }
    });
  }

  closeEditDialog() {
    this.showEditDialog = false;
  }

  saveEditMember() {
    if (!this.editMemberData) return;
    this.showConfirmDialog = false;
    this.isLoading = true;
    this.companyMemberService.updateMember(this.editMemberData).subscribe(response => {
      if (response && response.data) {
        this.isLoading = false;
        this.showEditDialog = false;
        this.members = this.members.map(member => {
          if (member.id === this.editMemberData!.id) {
            return {
              ...member,
              status: this.editMemberData!.status
            };
          }
          return member;
        });
      } else {
        this.isLoading = false;
        this.errorTitle = 'Lỗi';
        this.errorMessage = 'Cập nhật thành viên thất bại.';
        this.showErrorDialog = true;
      }
      this.isLoading = false;
    });
  }

  handleCancel() {
    this.showConfirmDialog = false;
    this.showEditDialog = false;
  }

  handleCancelError() {
    this.showErrorDialog = false;
  }

  handleConfirm() {
    this.showConfirmDialog = false;
    if (this.confirmAction === 'save') {
      this.saveEditMember();
    } else if (this.confirmAction === 'cancel') {
      this.handleCancel();
    }
  }

  openConfirm(action: 'save' | 'cancel') {
    this.confirmAction = action;
    this.confirmTitle = 'Xác nhận';
    this.confirmMessage = action === 'save'
      ? 'Bạn có chắc chắn muốn lưu thay đổi?'
      : 'Bạn có chắc chắn muốn hủy chỉnh sửa?';
    this.showConfirmDialog = true;
  }
}
