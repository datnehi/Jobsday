import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyRelatedInfoComponent } from './company-related-info.component';

describe('CompanyRelatedInfoComponent', () => {
  let component: CompanyRelatedInfoComponent;
  let fixture: ComponentFixture<CompanyRelatedInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyRelatedInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyRelatedInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
