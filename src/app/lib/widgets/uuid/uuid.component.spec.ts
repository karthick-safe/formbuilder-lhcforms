import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UUIDComponent } from './uuid.component';

xdescribe('UUIDComponent', () => {
  let component: UUIDComponent;
  let fixture: ComponentFixture<UUIDComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UUIDComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UUIDComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
