import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../../../services/search.service';
import { ConvertEnumService } from '../../../../services/common/convert-enum.service';
import { LoadingComponent } from "../../../common/loading/loading.component";
import { ErrorDialogComponent } from "../../../common/error-dialog/error-dialog.component";
import { CvsService } from '../../../../services/cvs.service';
import { HrViewCandidateService } from '../../../../services/hr-view-candidate.service';
import { NotificationService } from '../../../../services/notification.service';

@Component({
  selector: 'app-search-candiate',
  imports: [
    FormsModule,
    CommonModule,
    LoadingComponent,
    ErrorDialogComponent
  ],
  templateUrl: './search-candiate.component.html',
  styleUrl: './search-candiate.component.css'
})
export class SearchCandiateComponent {
  experiences = ['Tất cả', 'Không yêu cầu', 'Dưới 1 năm', '2 năm', '3 năm', '4 năm', '5 năm', 'Trên 5 năm'];
  levels = ['Tất cả', 'Fresher', 'Intern', 'Junior', 'Senior'];

  searchText: string = '';
  pendingSearchText: string = '';
  selectedExperience: string = 'Tất cả';
  selectedLevel: string = 'Tất cả';

  candidates: any[] = [];

  currentPage: number = 0;
  totalPages: number = 1;
  isLoading: boolean = false;

  showErrorDialog: boolean = false;
  errorTitle: string = '';
  errorMessage: string = '';

  constructor(
    private searchService: SearchService,
    private convertEnum: ConvertEnumService,
    private cvsService: CvsService,
    private hrViewCandidateService: HrViewCandidateService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.onSearch();
  }

  // Xử lý lọc nâng cao và phân trang
  onSearch(page: number = 0) {
    this.isLoading = true;
    const filters = {
      keyword: this.searchText,
      experience: this.convertEnum.mapExperienceToEnum(this.selectedExperience),
      level: this.convertEnum.mapLevelToEnum(this.selectedLevel),
      candidatesPage: page
    };
    this.searchService.searchCandidate(filters).subscribe(response => {
      if (response.data) {
        const candidateData = response.data;
        this.candidates = (candidateData.content || []).map((candidate: any) => ({
          ...candidate,
          experience: this.convertEnum.mapExperienceFromEnum(candidate.experience),
          level: this.convertEnum.mapLevelFromEnum(candidate.level)
        }));
        this.totalPages = response.data.totalPages;
        this.currentPage = response.data.number;
        this.pendingSearchText = this.searchText;
        this.isLoading = false;
      }
    }, () => {
      this.isLoading = false;
      this.showErrorDialog = true;
      this.errorTitle = 'Lỗi tìm kiếm ứng viên';
      this.errorMessage = 'Đã xảy ra lỗi khi tìm kiếm ứng viên. Vui lòng thử lại sau.';
    });
  }

  selectExperience(exp: string) {
    this.selectedExperience = exp;
    this.currentPage = 0;
    this.onSearch();
  }

  selectLevel(level: string) {
    this.selectedLevel = level;
    this.currentPage = 0;
    this.onSearch();
  }

  clearFilters() {
    this.selectedExperience = '';
    this.selectedLevel = '';
    this.currentPage = 0;
    this.onSearch();
  }

  changePage(page: number) {
    if (this.pendingSearchText !== this.searchText) {
      this.onSearch(0);
    } else if (page >= 0 && page < this.totalPages) {
      this.onSearch(page);
    }
  }

  viewDetail(cvId: number) {
    if (!cvId) return;
    this.isLoading = true;
    let view = false;
    const candidate = this.candidates.find(c => c.id === cvId);
    this.cvsService.downloadCv(cvId).subscribe(response => {
      const blob = response.body!;
      const url = window.URL.createObjectURL(blob);

      const contentType = response.headers.get('Content-Type');
      let fileName = 'cv';
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (matches && matches[1]) {
          fileName = decodeURIComponent(matches[1]);
        }
      }

      if (contentType?.includes('pdf')) {
        const pdfWindow = window.open(url, '_blank');
        if (!pdfWindow || pdfWindow.closed || typeof pdfWindow.closed == 'undefined') {
          this.showErrorDialog = true;
          this.errorTitle = 'Lỗi xem CV';
          this.errorMessage = 'Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép cửa sổ bật lên để xem CV.';
          this.isLoading = false;
          return;
        }
        view = true;
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.URL.revokeObjectURL(url);
        view = true;
      }
      if (view) {
        this.hrViewCandidateService.createHrViewCandidate(candidate.userId).subscribe(response => {
          if (response.status !== 201) return;
          const data = {
            userTo: candidate.userId,
            type: "HR_VIEWED"
          };
          this.notificationService.sendNotification(data).subscribe();
        });
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
