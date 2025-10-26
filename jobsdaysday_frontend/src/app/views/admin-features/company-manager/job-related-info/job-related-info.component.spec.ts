import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobRelatedInfoComponent } from './job-related-info.component';

describe('JobRelatedInfoComponent', () => {
  let component: JobRelatedInfoComponent;
  let fixture: ComponentFixture<JobRelatedInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobRelatedInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobRelatedInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
