/**
 * Widget to represent enableBehaviour field.
 */
import { Component, OnInit } from '@angular/core';
import { LfbControlWidgetComponent } from '../lfb-control-widget/lfb-control-widget.component';

@Component({
  selector: 'lfb-resource-choices',
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
            
            <table style="width:100%">
            <thead>
    <th bgcolor="grey" style="width:70%">Descriptions</th>
    <th bgcolor="grey" >Display</th>
   
  </thead>
  <tbody>
  <tr *ngFor="let option of schema.enum" >  
                            <td> <lfb-label [for]="id + '.' + option" class="horizontal control-label " [title]="displayTexts[option]"></lfb-label></td>
                            <td>
                            <input [formControl]="control" [attr.id]="id + '.' + option" name="{{id}}"
                            value="{{option}}" type="radio"  [attr.disabled]="(schema.readOnly || option.readOnly) ? '' : null">
                            </td>
                        </tr>
                        </tbody>

</table>   
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [
  ]
})
export class ResourceChoicesComponent extends LfbControlWidgetComponent {
  displayTexts = {
    one: 'Please confirm you have been in sitting postion before taking the measurement for at least 5 minutes.',
    two: 'Please confirm you have not urinated more than 30 minutes prior to taking the measurement.',
    three: 'Please confirm you have not eaten 30 minutes before taking the measurement.',
    four: 'You have both feet flat on the ground and legs are uncrossed.'
  }
}
