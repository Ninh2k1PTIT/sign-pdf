import { Component, HostListener, ViewEncapsulation } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  NgxExtendedPdfViewerService,
  PdfLoadedEvent,
} from 'ngx-extended-pdf-viewer';
import { PageRenderEvent } from 'ngx-extended-pdf-viewer/lib/events/page-render-event';
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
  count = 0;

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

  //Chỉ hoạt động khi tạo chữ ký
  @HostListener('document:mousemove', ['$event'])
  mousemove(event: MouseEvent) {
    if (this.openSignature) {
      let drag = document.getElementById('drag') as HTMLElement;
      drag.style.display = 'flex';
      drag.style.top = event.clientY - drag.offsetHeight / 2 + 'px';
      drag.style.left = event.clientX - drag.offsetWidth / 2 + 'px';
    }
  }

  //Chỉ hoạt động khi tạo chữ ký
  @HostListener('document:mousedown', ['$event'])
  mousedown(event: MouseEvent) {
    if (this.openSignature) {
      let drag = document.getElementById('drag') as HTMLElement;
      drag.style.display = 'none';
      this.openSignature = false;
    }
  }

  openSignaturePad(modal: any) {
    this.modalService.open(modal, { size: 'xl' });
  }

  setSignature(ev: any) {
    //Khi tạo đc chữ ký thì mới hiện thả chữ ký
    if (this.openSignature) {
      let drag = document.getElementById('drag') as HTMLElement;
      drag.style.display = 'none';
      this.openSignature = false;

      //Bấm vào trang pdf mới gắn đc chữ ký
      if (ev.target?.tagName === 'CANVAS') {
        let canvasWrapper = ev.target.parentElement as HTMLElement;
        let page = canvasWrapper.parentElement as HTMLElement;
        const signatureInfo = {
          id: this.count++,
          pageNumber: parseInt(page.getAttribute('data-page-number') || ''),
          x: ev.offsetX,
          y: ev.offsetY,
          width: 360,
          height: 90,
          fontSize: 12,
          srcImg: this.signatureImage,
        };

        //Ảnh chữ ký
        let img = document.createElement('img') as HTMLImageElement;
        img.src = signatureInfo.srcImg;
        img.width = 180;
        img.height = 90;

        //Thẻ bọc thông tin
        let wrap = document.createElement('div') as HTMLDivElement;
        wrap.className = 'wrap';
        wrap.style.fontSize = signatureInfo.fontSize + 'px';

        //Thẻ ghi thông tin
        let info = document.createElement('div') as HTMLDivElement;
        info.className = 'info';
        info.innerHTML =
          '<div>Ký bởi: Nguyễn Việt Hưng</div><div>Tên tổ chức: CMC CIST</div><div>Thư điện tử: nguyentienhaininh@gmail.com</div><div>Ngày ký: 11/10/2022</div>';
        wrap.appendChild(info);

        //Thẻ chữ ký = Thẻ ảnh + Thẻ bọc
        let signature = document.createElement('div');
        signature.appendChild(img);
        signature.appendChild(wrap);
        signature.className = 'signature';
        signature.style.top = signatureInfo.y - img.height / 2 + 'px';
        signature.style.left = signatureInfo.x - img.width + 'px';

        //Resize
        let resizable = document.createElement('div') as HTMLDivElement;
        resizable.className = 'resizable';
        resizable.onmousedown = (event) => {
          let canvasWrapper1 = signature.parentElement as HTMLElement;
          this.handTool = false;
          const startY = event.clientY,
            startX = event.clientX,
            signatureStartWidth = signature.offsetWidth,
            signatureStartHeight = signature.offsetHeight,
            imgStartWidth = img.offsetWidth,
            imgStartHeight = img.offsetHeight,
            wrapStartWidth = wrap.offsetWidth,
            wrapStartHeight = wrap.offsetHeight;
          let onMouseMove = (event: MouseEvent) => {
            const width = signatureStartWidth + event.clientX - startX - 6,
              height = signatureStartHeight + event.clientY - startY - 6;
            if (width >= 100 && width <= 700) {
              signature.style.width = width + 'px';
              img.style.width =
                imgStartWidth + (event.clientX - startX) / 2 + 'px';
              wrap.style.width =
                wrapStartWidth + (event.clientX - startX) / 2 + 'px';
            }
            if (height >= 50 && height <= 350) {
              signature.style.height = height + 'px';
              img.style.height = imgStartHeight + event.clientY - startY + 'px';
              wrap.style.height =
                wrapStartHeight + event.clientY - startY + 'px';
            }
            const newHeight = parseInt(wrap.style.height.split('px')[0]);
            const newWidth = parseInt(wrap.style.width.split('px')[0]);
            // const fontSize = 4 * (1 + (newHeight * newWidth) / (180 * 90));
            // wrap.style.fontSize = fontSize + 'px';
            console.log(
              info.offsetHeight,
              newHeight,
              info.offsetHeight / newHeight
            );
            if (info.offsetHeight > newHeight) {
              let oldOffsetHeight;
              console.log('2');
              while (true) {
                if (info.offsetHeight / newHeight > 1) {
                  oldOffsetHeight = info.offsetHeight;
                  wrap.style.fontSize = signatureInfo.fontSize - 0.25 + 'px';
                  if (oldOffsetHeight == info.offsetHeight) break;
                  signatureInfo.fontSize = signatureInfo.fontSize - 0.25;
                  continue;
                } else if (info.offsetHeight / newHeight < 0.75) {
                  wrap.style.fontSize = signatureInfo.fontSize + 0.25 + 'px';
                  oldOffsetHeight = info.offsetHeight;
                  if (oldOffsetHeight == info.offsetHeight) break;
                  signatureInfo.fontSize = signatureInfo.fontSize + 0.25;
                  console.log(info.offsetHeight);
                  continue;
                } else {
                  break;
                }
              }
            }

            if (info.offsetHeight / newHeight <= 0.75) {
              let oldOffsetHeight;
              console.log('1');
              while (true) {
                if (info.offsetHeight / newHeight < 0.75) {
                  wrap.style.fontSize = signatureInfo.fontSize + 0.25 + 'px';
                  signatureInfo.fontSize = signatureInfo.fontSize + 0.25;
                  oldOffsetHeight = info.offsetHeight;
                  if (oldOffsetHeight == info.offsetHeight) break;
                  continue;
                } else if (info.offsetHeight / newHeight > 1) {
                  wrap.style.fontSize = signatureInfo.fontSize - 0.25 + 'px';
                  signatureInfo.fontSize = signatureInfo.fontSize - 0.25;
                  oldOffsetHeight = info.offsetHeight;
                  if (oldOffsetHeight == info.offsetHeight) break;
                  continue;
                } else {
                  break;
                }
              }
            }

            this.list[this.fileNumber].signatures
              .filter((x) => x.id === signatureInfo.id)
              .map((x) => {
                x.width = newWidth;
                x.height = newHeight;
                x.fontSize = signatureInfo.fontSize;
                return x;
              });
          };
          canvasWrapper1.addEventListener('mousemove', onMouseMove);
          document.onmouseup = () => {
            this.handTool = true;
            canvasWrapper1.removeEventListener('mousemove', onMouseMove);
            resizable.onmouseup = null;
          };
        };
        signature.appendChild(resizable);

        //Di chuyển thẻ chữ ký
        let move = (event: any) => {
          let canvasWrapper1 = signature.parentElement as HTMLElement;

          this.handTool = false;
          let shiftX = event.clientX - signature.getBoundingClientRect().left;
          let shiftY = event.clientY - signature.getBoundingClientRect().top;
          canvasWrapper1.append(signature);

          // moves the signature at (pageX, pageY) coordinates
          // taking initial shifts into account
          let moveAt = (pageX: number, pageY: number) => {
            const left =
              pageX - shiftX - canvasWrapper1.getBoundingClientRect().left;
            const top =
              pageY - shiftY - canvasWrapper1.getBoundingClientRect().top;
            if (
              left >= 5 &&
              left <= canvasWrapper1.offsetWidth - signature.offsetWidth - 5
            ) {
              signature.style.left =
                pageX -
                shiftX -
                canvasWrapper1.getBoundingClientRect().left +
                'px';
              this.list[this.fileNumber].signatures
                .filter((x) => x.id === signatureInfo.id)
                .map((x) => {
                  x.x = left;
                  return x;
                });
            }
            if (
              top >= 5 &&
              top <= canvasWrapper1.offsetHeight - signature.offsetHeight - 5
            ) {
              signature.style.top =
                pageY -
                shiftY -
                canvasWrapper1.getBoundingClientRect().top +
                'px';
              this.list[this.fileNumber].signatures
                .filter((x) => x.id === signatureInfo.id)
                .map((x) => {
                  x.y = top;
                  return x;
                });
            }
          };

          let onMouseMove = (event: MouseEvent) => {
            moveAt(event.pageX, event.pageY);
          };
          moveAt(event.pageX, event.pageY);
          // move the signature on mousemove
          canvasWrapper1.addEventListener('mousemove', onMouseMove);

          // drop the signature, remove unneeded handlers
          document.onmouseup = () => {
            this.handTool = true;
            canvasWrapper1.removeEventListener('mousemove', onMouseMove);
            img.onmouseup = null;
          };
        };
        img.addEventListener('mousedown', move);
        wrap.addEventListener('mousedown', move);

        signature.ondragstart = function () {
          return false;
        };

        canvasWrapper.appendChild(signature);
        this.list[this.fileNumber].signatures.push({
          ...signatureInfo,
          html: signature,
        });
      }
    }
  }

  setSignatureImage(ev: any) {
    this.signatureImage = ev;
    this.openSignature = true;
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

  hasSignature(fileNumber: number, pageNumber: number) {
    return this.list[fileNumber].signatures.some(
      (x) => x.pageNumber == pageNumber
    );
  }

  a(ev: PageRenderEvent) {
    let canvas = ev.source.canvas as HTMLElement;
    let canvasWrapper = canvas.parentElement;
    const signature = this.list[this.fileNumber].signatures.find(
      (x) => x.pageNumber == ev.pageNumber
    );
    if (signature) {
      canvasWrapper?.appendChild(signature.html!);
    }
  }
}
