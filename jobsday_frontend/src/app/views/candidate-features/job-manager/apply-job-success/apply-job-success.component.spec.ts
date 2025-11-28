import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplyJobSuccessComponent } from './apply-job-success.component';

describe('ApplyJobSuccessComponent', () => {
  let component: ApplyJobSuccessComponent;
  let fixture: ComponentFixture<ApplyJobSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplyJobSuccessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplyJobSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
