import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrRelatedInfoComponent } from './hr-related-info.component';

describe('HrRelatedInfoComponent', () => {
  let component: HrRelatedInfoComponent;
  let fixture: ComponentFixture<HrRelatedInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrRelatedInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrRelatedInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
