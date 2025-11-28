import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CandidateRelatedInfoComponent } from './candidate-related-info.component';

describe('CandidateRelatedInfoComponent', () => {
  let component: CandidateRelatedInfoComponent;
  let fixture: ComponentFixture<CandidateRelatedInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CandidateRelatedInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CandidateRelatedInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
