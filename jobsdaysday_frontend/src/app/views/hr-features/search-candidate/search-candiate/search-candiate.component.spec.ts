import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchCandiateComponent } from './search-candiate.component';

describe('SearchCandiateComponent', () => {
  let component: SearchCandiateComponent;
  let fixture: ComponentFixture<SearchCandiateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchCandiateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchCandiateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
