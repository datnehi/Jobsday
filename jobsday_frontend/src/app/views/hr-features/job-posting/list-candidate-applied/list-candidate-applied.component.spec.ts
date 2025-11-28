import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListCandidateAppliedComponent } from './list-candidate-applied.component';

describe('ListCandidateAppliedComponent', () => {
  let component: ListCandidateAppliedComponent;
  let fixture: ComponentFixture<ListCandidateAppliedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListCandidateAppliedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListCandidateAppliedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
