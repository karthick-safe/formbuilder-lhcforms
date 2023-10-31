import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceChoicesComponent } from './resource-choices.component';

xdescribe('ResourceChoicesComponent', () => {
  let component: ResourceChoicesComponent;
  let fixture: ComponentFixture<ResourceChoicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResourceChoicesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceChoicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
