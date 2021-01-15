import {OnInit, AfterViewInit, Component, ViewChild, ElementRef, AfterContentInit, Input} from '@angular/core';
import { TreeComponent, TreeModel, TreeNode, ITreeOptions } from '@circlon/angular-tree-component';
import {FetchService} from '../fetch.service';
import {MatInput} from '@angular/material/input';
import {ShareObjectService} from '../share-object.service';
import {ITreeNode} from '@circlon/angular-tree-component/lib/defs/api';
import {FormService} from '../services/form.service';
import {NgxSchemaFormComponent} from '../ngx-schema-form/ngx-schema-form.component';
import {ItemJsonEditorComponent} from '../lib/widgets/item-json-editor.component';

export class LinkIdCollection {
  linkIdHash = {};

  addLinkId(linkId, itemPath): boolean {
    let ret = false;
    if (linkId && linkId.trim().length > 0) {
      this.linkIdHash[linkId.trim()] = itemPath;
      ret = true;
    }

    return ret;
  }

  getItemPath(linkId): string {
    return this.linkIdHash[linkId];
  }

  hasLinkId(linkId): boolean {
    return this.linkIdHash.hasOwnProperty(linkId);
  }

  deleteLinkId(linkId): boolean {
    let ret = false;
    if (this.getItemPath(linkId)) {
      delete this.linkIdHash[linkId];
      ret = true;
    }
    return ret;
  }

  changeLinkId(oldLinkId, newLinkId): boolean {
    let ret = false;
    const itemPath = this.getItemPath(oldLinkId);
    if (itemPath) {
      this.deleteLinkId(oldLinkId);
      this.addLinkId(newLinkId, itemPath);
      ret = true;
    }
    return ret;
  }
}

/**
 * Handle side bar tree, item level fields editing in ui and editing in json
 */
@Component({
  selector: 'app-item-component',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.css']
})
export class ItemComponent implements OnInit, AfterViewInit {
  id = 1;
  @ViewChild('tree') treeComponent: TreeComponent;
  @ViewChild('jsonEditor') jsonItemEditor: ItemJsonEditorComponent;
  @ViewChild('uiEditor') uiItemEditor: NgxSchemaFormComponent;
  @ViewChild('formSearch') sInput: MatInput;
  @ViewChild('drawer', { read: ElementRef }) sidenavEl: ElementRef;
  // qItem: any;
  focusNode: ITreeNode;
  options: ITreeOptions;
  @Input()
  form: any = {item: [{text: 'Item 1'}]};
  exportForm: any;
  isTreeExpanded = false;
  editType = 'ui';
  itemEditorSchema: any;
  editor = 'ngx';

  acOptions = {
    searchUrl: 'https://lforms-fhir.nlm.nih.gov/baseR4/Questionnaire',
    httpOptions: {
      observe: 'body' as const,
      responseType: 'json' as const
    }
  };

  linkIdCollection = new LinkIdCollection();

  constructor(
              private formService: FormService,
              private dataSrv: FetchService,
              private selectedNodeSrv: ShareObjectService) {
    this.options = this.dataSrv.getOptions();
    this.dataSrv.getItemEditorSchema().subscribe((data) => {
      this.itemEditorSchema = data;
    });
  }

  ngOnInit() {
  }


  /**
   * Initialize component
   */
  ngAfterViewInit() {
    // Setup listeners to pickup node selections
   // this.onFocus();
    this.selectedNodeSrv.object$.subscribe((itemData) => {
      if (this.focusNode && this.focusNode.data !== itemData) {
        this.focusNode.data = itemData;
      }
    });
    this.options.scrollContainer = this.sidenavEl.nativeElement;
    this.formService.setTreeModel(this.treeComponent.treeModel);
  }


  /**
   * Tree initialization
   * @param event
   */
  onTreeInitialized(event) {
    const node = this.treeComponent.treeModel.getFirstRoot();
    this.treeComponent.treeModel.setFocusedNode(node);
    this.setNode(node);
  }

  onFocus(event) {
    this.setNode(event.node);
  }

  /**
   * Focus node is
   * @param node
   */
  setNode(node: ITreeNode): void {
    this.focusNode = node;
    this.selectedNodeSrv.setNode(this.focusNode);
    if (this.focusNode) {
      if (this.focusNode.data && !this.focusNode.data.linkId) {
        this.focusNode.data.linkId = this.defaultLinkId(this.focusNode);
      }
      this.selectedNodeSrv.setObject(this.focusNode.data);
    }
  }

  /**
   * Handle tree expansion/collapse
   */

  toggleTreeExpansion() {
    if (this.treeComponent) {
      if (this.isTreeExpanded) {
        this.treeComponent.treeModel.collapseAll();
        this.isTreeExpanded = false;
      } else {
        this.treeComponent.treeModel.expandAll();
        this.isTreeExpanded = true;
      }
    }
  }

  extractDataFromTree(roots: any [], collection) {
    for (const root of roots) {
      collection.push(root.data);
      if (root.children && root.children.length > 0) {
        collection.item = [];
        this.extractDataFromTree(root.children, collection.item);
      }
    }
  }


  /**
   * Create linkId, using a random number generated by the tree.
   * @param node
   */
  defaultLinkId(node: ITreeNode): string {
    return '' + node.id;
  }


  /**
   *
   */
  updatedForm() {
    const items: any = [];
    if (this.treeComponent) {
      const roots = this.treeComponent.treeModel.roots;
      if (roots && roots.length > 0) {
        this.extractDataFromTree(roots, items);
      }
    }
    this.exportForm = this.form;
    this.exportForm.item = items;
    return this.exportForm;
  }

  /**
   * Toggle between ui and json
   * @param event
   */
  toggleEditType(event) {
    this.editType = this.editType === 'json' ? 'ui' : 'json';
    if (event.index > 0) {
      this.updatedForm();
    }
  }


  /**
   * Compute tree hierarchy sequence numbering.
   * @param node - Target node of computation
   */
  getIndexPath(node: ITreeNode): number[] {
    const ret: number [] = [];
    if (node) {
      ret.push(node.index + 1);
      while (node.level > 1) {
        node = node.parent;
        ret.push(node.index + 1);
      }
    }
    return ret.reverse();
  }


  /**
   * Handle add item button
   * @param event
   */
  addItem(event): void {
    this.focusNode.parent.data.item.splice(this.focusNode.index + 1, 0, {text: 'New item ' + this.id++});
    this.treeComponent.treeModel.update();
    this.treeComponent.treeModel.focusNextNode();
    this.setNode(this.treeComponent.treeModel.getFocusedNode());
  }


  /**
   * TODO - Add loinc item from fhir server.
   * @param event
   */
  addLoincItem(event): void {
    this.addItem(event);
  }


  /**
   * TODO - not sure if we need this yet.
   * @param linkId
   */
  registerLinkId(linkId) {
    this.linkIdCollection.addLinkId(linkId, this.focusNode.path.join('/'));
  }
}
