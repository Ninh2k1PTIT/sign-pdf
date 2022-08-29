import { Component, ViewEncapsulation, ViewChild } from '@angular/core';
import { getComponent } from '@syncfusion/ej2-base';
import { SignatureComponent } from '@syncfusion/ej2-angular-inputs';
import { ClickEventArgs } from '@syncfusion/ej2-navigations';
import { Button } from '@syncfusion/ej2-buttons';
import { Signature } from '@syncfusion/ej2-inputs';

@Component({
  selector: 'app-signature-pad',
  templateUrl: './signature-pad.component.html',
  styleUrls: ['./signature-pad.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SignaturePadComponent {
  @ViewChild('signature') signature: SignatureComponent | any;
  public thumbnails: string = '';
  public colorPicker = ['#000000', 'red', 'blue'];
  public widthSelector = [1, 2, 3];

  public change(): void {
    let signature: Signature = getComponent(
      document.getElementById('signature')!,
      'signature'
    );
    this.updateUndoRedo();
    this.thumbnails = this.signature.getSignature();
  }
  public onCreate(e: any) {
    this.thumbnails = this.signature.getSignature();
    this.clearButton();
    let toolbarlItems: NodeListOf<Element> = document.querySelectorAll(
      '.e-toolbar .e-toolbar-items .e-toolbar-item .e-tbar-btn.e-tbtn-txt'
    );
    for (var i = 0; i < toolbarlItems.length; i++) {
      if (toolbarlItems[i].children[0].classList.contains('e-undo')) {
        let undoButton: Button = getComponent(
          toolbarlItems[i] as HTMLElement,
          'btn'
        );
        undoButton.disabled = true;
      }
      if (toolbarlItems[i].children[0].classList.contains('e-redo')) {
        let redoButton: Button = getComponent(
          toolbarlItems[i] as HTMLElement,
          'btn'
        );
        redoButton.disabled = true;
      }
    }
  }

  clicked(args: ClickEventArgs): void {
    if (this.signature.disabled && args.item.tooltipText != 'Disabled') {
      return;
    }
    switch (args.item.tooltipText) {
      case 'Hoàn tác (Ctrl + Z)':
        if (this.signature.canUndo()) {
          this.signature.undo();
          this.updateUndoRedo();
        }
        break;
      case 'Làm lại (Ctrl + Y)':
        if (this.signature.canRedo()) {
          this.signature.redo();
          this.updateUndoRedo();
        }
        break;
      case 'Xóa':
        this.signature.clear();
        if (this.signature.isEmpty) {
          this.clearButton();
        }
        break;
    }
  }

  clearButton() {
    let tlItems: NodeListOf<Element> = document.querySelectorAll(
      '.e-toolbar .e-toolbar-items .e-toolbar-item .e-tbar-btn.e-tbtn-txt'
    );
    for (var i = 0; i < tlItems.length; i++) {
      if (tlItems[i].children[0].classList.contains('e-clear')) {
        let clrBtn: Button = getComponent(tlItems[i] as HTMLElement, 'btn');
        if (this.signature.isEmpty()) {
          clrBtn.disabled = true;
        } else {
          clrBtn.disabled = false;
        }
      }
    }
  }

  updateUndoRedo() {
    let undoButton!: Button;
    let redoButton!: Button;
    let tlItems: NodeListOf<Element> = document.querySelectorAll(
      '.e-toolbar .e-toolbar-items .e-toolbar-item .e-tbar-btn.e-tbtn-txt'
    );
    for (var i = 0; i < tlItems.length; i++) {
      if (tlItems[i].children[0].classList.contains('e-undo')) {
        undoButton = getComponent(tlItems[i] as HTMLElement, 'btn');
      }
      if (tlItems[i].children[0].classList.contains('e-redo')) {
        redoButton = getComponent(tlItems[i] as HTMLElement, 'btn');
      }
    }
    if (this.signature.canUndo()) {
      undoButton.disabled = false;
    } else {
      undoButton.disabled = true;
    }
    if (this.signature.canRedo()) {
      redoButton.disabled = false;
    } else {
      redoButton.disabled = true;
    }
  }

  chooseColor(color: string) {
    this.signature.strokeColor = color;
  }

  chooseWidth(width: number) {
    this.signature.maxStrokeWidth = width;
  }
}
