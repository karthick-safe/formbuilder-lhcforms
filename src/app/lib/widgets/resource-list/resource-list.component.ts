/**
 * Widget to represent enableBehaviour field.
 */
import { Component, OnInit } from '@angular/core';
import {LfbControlWidgetComponent} from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  selector: 'lfb-resource-list',
  template: `
  <input *ngIf="schema.widget.id ==='hidden'; else displayTemplate"
  name="{{name}}" type="hidden" [formControl]="control">
<ng-template #displayTemplate >

<div class="row">
        <div [ngClass]="schema.widget.labelWidthClass">          
        <lfb-label [helpMessage]="schema.description" [title]="schema.title"></lfb-label>
        </div>
        <div [ngClass]="schema.widget.controlWidthClass" >
          <div [ngClass]="{row: schema.widget.layout === 'row'}" style="width:100%">    
          <select >
          <option value="blood">Blood Pressure</option>
        </select> 
          </div>
        </div>
      </div>
    </ng-template>


  `,
  styles: [
  ]
})
export class ResourceListComponent extends LfbControlWidgetComponent {
  displayTexts = {
    bloodpressure: 'Blood Pressure'
  }
}
