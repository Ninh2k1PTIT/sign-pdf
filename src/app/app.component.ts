import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Draggable } from '@syncfusion/ej2-base';
import {
  NgxExtendedPdfViewerService,
  PdfLoadedEvent,
} from 'ngx-extended-pdf-viewer';

interface PdfFile {
  name: string;
  data: string | ArrayBuffer | null;
  signatures: number[];
  thumbnails: string[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
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
  draggable = true;
  useHandle = false;
  zIndex: any;
  zIndexMoving: any;
  preventDefaultEvent = false;
  trackPosition = true;
  position: any;
  movingOffset = { x: 0, y: 0 };
  endOffset = { x: 0, y: 0 };

  list: PdfFile[] = [];
  @ViewChild('ele', { static: false }) element: any;
  ngAfterViewInit() {
    // let draggable: Draggable = new Draggable(this.element.nativeElement, {
    //   clone: false,
    // });
  }

  constructor(
    private modalService: NgbModal,
    private pdfService: NgxExtendedPdfViewerService
  ) {}

  onStart(event: any) {
    console.log('started output:', event);
  }

  onStop(event: any) {
    console.log('stopped output:', event);
  }

  onMoving(event: any) {
    this.movingOffset.x = event.x;
    this.movingOffset.y = event.y;
  }

  onMoveEnd(event: any) {
    this.endOffset.x = event.x;
    this.endOffset.y = event.y;
  }

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

  createSignature() {
    this.list[this.fileNumber].signatures.push(this.pageNumber);
    this.modalService.dismissAll();
  }

  deleteSignature(fileNumber: number, signatureIndex: number) {}
}
