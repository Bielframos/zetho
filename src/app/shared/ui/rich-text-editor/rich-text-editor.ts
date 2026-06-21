import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { TiptapEditorDirective } from 'ngx-tiptap';

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, TiptapEditorDirective],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './rich-text-editor.html',
  styles: `
    .tiptap-editor-container {
      border: 1px solid var(--color-gray-6);
      background-color: var(--color-gray-2);

      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .tiptap-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 8px;
      background-color: var(--color-gray-3);
      border-bottom: 1px solid var(--color-gray-6);
    }

    .tiptap-toolbar button {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      color: var(--color-gray-11);
      transition: all 0.2s;
      cursor: pointer;
    }

    .tiptap-toolbar button:hover {
      background-color: var(--color-gray-4);
      color: var(--color-gray-12);
    }

    .tiptap-toolbar button.active {
      background-color: var(--color-blue-9);
      color: white;
    }

    .tiptap-content {
      padding: 12px 16px;
      min-height: 150px;
      max-height: 400px;
      overflow-y: auto;
      outline: none;
    }

    /* Estilização interna do Tiptap */
    .tiptap-content .ProseMirror {
      outline: none;
      min-height: 150px;
    }

    .tiptap-content p {
      margin-bottom: 8px;
      line-height: 1.6;
    }

    .tiptap-content strong {
      font-weight: 600;
      color: var(--color-gray-12);
    }

    .tiptap-content em {
      font-style: italic;
    }

    .tiptap-content s {
      text-decoration: line-through;
    }

    .tiptap-content ul {
      list-style-type: disc;
      padding-left: 20px;
      margin-bottom: 12px;
    }

    .tiptap-content ol {
      list-style-type: decimal;
      padding-left: 20px;
      margin-bottom: 12px;
    }

    .tiptap-content blockquote {
      border-left: 4px solid var(--color-blue-9);
      padding-left: 12px;
      color: var(--color-gray-10);
      font-style: italic;
      margin: 12px 0;
    }

    .tiptap-content h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-blue-12);
      margin-top: 16px;
      margin-bottom: 8px;
    }

    .tiptap-content h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-blue-12);
      margin-top: 16px;
      margin-bottom: 8px;
    }

    .tiptap-content h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-blue-12);
      margin-top: 16px;
      margin-bottom: 8px;
    }
  `,
})
export class RichTextEditorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() content: string = '';
  @Input() placeholder: string = 'Escreva sua crítica aqui...';
  @Output() contentChange = new EventEmitter<string>();

  editor!: Editor;

  ngOnInit(): void {
    this.editor = new Editor({
      extensions: [StarterKit],
      content: this.content,
      onUpdate: ({ editor }) => {
        this.contentChange.emit(editor.getHTML());
      },
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['content'] && this.editor) {
      const newVal = changes['content'].currentValue || '';
      if (this.editor.getHTML() !== newVal) {
        this.editor.commands.setContent(newVal);
      }
    }
  }

  toggleBold() {
    this.editor.chain().focus().toggleBold().run();
  }

  toggleItalic() {
    this.editor.chain().focus().toggleItalic().run();
  }

  toggleStrike() {
    this.editor.chain().focus().toggleStrike().run();
  }

  toggleBulletList() {
    this.editor.chain().focus().toggleBulletList().run();
  }

  toggleOrderedList() {
    this.editor.chain().focus().toggleOrderedList().run();
  }

  toggleBlockquote() {
    this.editor.chain().focus().toggleBlockquote().run();
  }

  toggleHeading(level: 1 | 2 | 3) {
    this.editor.chain().focus().toggleHeading({ level }).run();
  }

  undo() {
    this.editor.chain().focus().undo().run();
  }

  redo() {
    this.editor.chain().focus().redo().run();
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.destroy();
    }
  }
}
