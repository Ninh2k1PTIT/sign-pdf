import { Component, HostListener, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  NgxExtendedPdfViewerService,
  PdfLoadedEvent,
} from 'ngx-extended-pdf-viewer';
import { PdfFile } from 'src/models/PdfFile';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'app' },
})
export class AppComponent {
  src: string | ArrayBuffer | null = '';
  totalPages: number = 0;
  pageNumber: number = 0;
  fileNumber: number = 0;
  scale: any = 'auto';
  scaleOptions = [
    'auto',
    'page-actual',
    'page-fit',
    'page-width',
    '50%',
    '100%',
    '125%',
    '150%',
    '200%',
    '300%',
    '400%',
  ];
  openSignature = false;
  signatureImage = '';
  list: PdfFile[] = [];
  handTool = true;

  constructor(
    private modalService: NgbModal,
    private pdfService: NgxExtendedPdfViewerService
  ) {}

  async inputFile(ev: any) {
    for (const file of ev.target.files) {
      this.list.push(await this.readFile(file));
    }
    this.src = this.list[0].data;
    this.pageNumber = 1;
  }

  readFile(file: File): Promise<PdfFile> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () =>
        resolve({
          name: file.name,
          data: reader.result,
          thumbnails: [],
          signatures: [],
        });
      reader.onerror = (error) => reject(error);
    });
  }

  fileChange(fileNumber: number) {
    if (this.fileNumber != fileNumber) {
      this.fileNumber = fileNumber;
      this.pageNumber = 1;
      this.src = this.list[fileNumber].data;
    }
  }

  async renderThumbnails() {
    let currentSize = this.list[this.fileNumber].thumbnails.length;
    if (currentSize < this.totalPages)
      for (let i = currentSize; i < this.totalPages; i++) {
        await this.pdfService
          .getPageAsImage(i + 1, { width: 1, height: 1, scale: 0.1 })
          .then((data) => {
            this.list[this.fileNumber].thumbnails.push(data);
          });
      }
  }

  pdfLoaded(pdf: PdfLoadedEvent) {
    this.totalPages = pdf.pagesCount;
    this.renderThumbnails();
  }

  nextPage() {
    if (this.pageNumber < this.totalPages) {
      this.pageNumber += 1;
      this.scrollToPage(this.pageNumber);
    }
  }

  previousPage() {
    if (this.pageNumber > 1) {
      this.pageNumber -= 1;
      this.scrollToPage(this.pageNumber);
    }
  }

  scrollToPage(pageNumber: number) {
    document
      .getElementById(pageNumber - 1 + '')
      ?.scrollIntoView({ behavior: 'auto', block: 'center' });
  }

  openSignaturePad(modal: any) {
    this.modalService.open(modal, { size: 'xl' });
  }

  selectSignature(
    fileNumber: number,
    pageNumber: number,
    signatureIndex: number
  ) {
    this.fileChange(fileNumber);
    this.pageNumber = pageNumber;
    this.scrollToPage(this.pageNumber);
  }

  setSignature(ev: any) {
    if (this.openSignature) {
      let drag = document.getElementById('drag') as HTMLElement;
      drag.style.display = 'none';
      this.openSignature = false;

      if (ev.target?.tagName === 'CANVAS') {
        let canvasWrapper = ev.target.parentElement as HTMLElement;
        let page = canvasWrapper.parentElement as HTMLElement;
        const signatureInfo = {
          pageNumber: parseInt(page.getAttribute('data-page-number') || ''),
          x: ev.offsetX,
          y: ev.offsetY,
        };

        let img = document.createElement('img') as HTMLImageElement;
        img.src = this.signatureImage;
        img.width = 180;
        img.height = 90;

        let signature = document.createElement('div');
        signature.appendChild(img);
        signature.className = 'signature';
        signature.style.top = signatureInfo.y - img.height / 2 + 'px';
        signature.style.left = signatureInfo.x - img.width / 2 + 'px';

        canvasWrapper.appendChild(signature);
        this.list[this.fileNumber].signatures.push(signatureInfo);

        signature.onmousedown = (event) => {
          this.handTool = false;
          let shiftX = event.clientX - signature.getBoundingClientRect().left;
          let shiftY = event.clientY - signature.getBoundingClientRect().top;

          signature.style.position = 'absolute';
          signature.style.zIndex = '1000';
          canvasWrapper.append(signature);

          // moves the signature at (pageX, pageY) coordinates
          // taking initial shifts into account
          let moveAt = (pageX: number, pageY: number) => {
            signature.style.left =
              pageX -
              shiftX -
              canvasWrapper.getBoundingClientRect().left +
              'px';
            signature.style.top =
              pageY - shiftY - canvasWrapper.getBoundingClientRect().top + 'px';
          };

          let onMouseMove = (event: MouseEvent) => {
            moveAt(event.pageX, event.pageY);
          };
          moveAt(event.pageX, event.pageY);
          // move the signature on mousemove
          canvasWrapper.addEventListener('mousemove', onMouseMove);

          // drop the signature, remove unneeded handlers
          signature.onmouseup = () => {
            this.handTool = true;
            canvasWrapper.removeEventListener('mousemove', onMouseMove);
            signature.onmouseup = null;
          };
        };

        signature.ondragstart = function () {
          return false;
        };
      }
    }
  }

  hasSignature(fileNumber: number, pageNumber: number) {
    return this.list[fileNumber].signatures.some(
      (x) => x.pageNumber == pageNumber
    );
  }

  @HostListener('document:mousemove', ['$event'])
  mousemove(event: MouseEvent) {
    if (this.openSignature) {
      let drag = document.getElementById('drag') as HTMLElement;
      drag.style.display = 'flex';
      drag.style.top = event.clientY - drag.offsetHeight / 2 + 'px';
      drag.style.left = event.clientX - drag.offsetWidth / 2 + 'px';
    }
  }

  @HostListener('document:mousedown', ['$event'])
  mousedown(event: MouseEvent) {
    if (this.openSignature) {
      let drag = document.getElementById('drag') as HTMLElement;
      drag.style.display = 'none';
      this.openSignature = false;
    }
  }

  setSignatureImage(ev: any) {
    this.signatureImage = ev;
    this.openSignature = true;
  }
}
