import { CvsService } from '../../../../services/cvs.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../models/user';
import { AuthService } from '../../../../services/auth.service';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../../services/user.service';
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";
import { LoadingComponent } from "../../../common/loading/loading.component";

@Component({
  selector: 'app-cv-manager',
  imports: [
    DatePipe,
    CommonModule,
    FormsModule,
    RouterModule,
    ErrorDialogComponent,
    LoadingComponent
  ],
  templateUrl: './cv-manager.component.html',
  styleUrls: ['./cv-manager.component.css']
})
export class CvManagerComponent {
  user: User = {} as User;
  uploadedCVs: any[] = [];
  isJobSearchActive: boolean = true;
  isCVTemplatesActive: boolean = false;
  allowNTDSearch: boolean = false;
  showDropdown: boolean[] = [];
  hoveredIndex: number | null = null;

  showRenameDialog = false;
  renameTitle = '';
  renameCvId: number | null = null;
  mainCvId: number | null = null;

  showErrorDialog = false;
  errorTitle = '';
  errorMessage = '';

  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private cvsService: CvsService,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.getCvs();
        this.allowNTDSearch = user.ntdSearch;
      }
    });
  }

  getCvs() {
    this.cvsService.getUserCVs().subscribe(response => {
      if (response && response.data) {
        this.uploadedCVs = response.data;
        const publicCv = this.uploadedCVs.find(cv => cv.isPublic);
        this.mainCvId = publicCv ? publicCv.id : null;
      }
    });
  }

  deleteCv(cvId: number) {
    this.cvsService.deleteCv(cvId).subscribe(response => {
      if (response) {
        this.getCvs();
      }
    });
  }

  changeTitle(cvId: number, currentTitle: string) {
    this.renameCvId = cvId;
    this.renameTitle = currentTitle;
    this.showRenameDialog = true;
  }

  closeRenameDialog() {
    this.showRenameDialog = false;
    this.renameCvId = null;
    this.renameTitle = '';
  }

  confirmRename() {
    if (this.renameCvId && this.renameTitle.trim()) {
      this.cvsService.changeTitle(this.renameCvId, this.renameTitle).subscribe(response => {
        if (response) {
          this.getCvs();
        }
      });
      this.showRenameDialog = false;
    }
  }

  setAsMain(cvId: number) {
    if (this.mainCvId !== null) {
      this.cvsService.setPublicStatus(this.mainCvId, false).subscribe();
    }
    this.cvsService.setPublicStatus(cvId, true).subscribe(response => {
      if (response) {
        this.getCvs();
      }
    });
  }

  toggleSearchChange() {
    this.userService.updateNtdSearch(this.allowNTDSearch).subscribe(response => {
      if (response) {
        this.authService.loadUserBeforeApp().then(() => {
          this.ngOnInit();
        });
      }
    });
  }

  viewCv(cvId: number, mode: string) {
    if (!cvId) return;
    this.isLoading = true;
    this.cvsService.downloadCv(cvId).subscribe(response => {
      const blob = response.body!;
      const url = window.URL.createObjectURL(blob);

      const contentType = response.headers.get('Content-Type');
      const contentDisposition = response.headers.get('content-disposition');
      let fileName = 'cv.pdf';
      if (contentDisposition) {
        const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (matches && matches[1]) {
          fileName = decodeURIComponent(matches[1]);
        }
      }

      if (mode == 'view' && contentType?.includes('pdf')) {
        const pdfWindow = window.open(url, '_blank');
        if (!pdfWindow || pdfWindow.closed || typeof pdfWindow.closed == 'undefined') {
          this.showErrorDialog = true;
          this.errorTitle = 'Lỗi xem CV';
          this.errorMessage = 'Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép cửa sổ bật lên để xem CV.';
          this.isLoading = false;
          return;
        }
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.URL.revokeObjectURL(url);
      }
      this.isLoading = false;
    }, () => {
      this.showErrorDialog = true;
      this.errorTitle = 'Lỗi xem CV';
      this.errorMessage = 'Đã xảy ra lỗi khi tải CV để xem. Vui lòng thử lại sau.';
      this.isLoading = false;
    });
  }

  handleCancel() {
    this.showErrorDialog = false;
  }

}
