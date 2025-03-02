import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Underline from '@tiptap/extension-underline'
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import Heading from '@tiptap/extension-heading'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  Underline as UnderlineIcon, 
  List as ListIcon, 
  ListOrdered as OrderedListIcon, 
  Heading1, 
  Heading2, 
  Link as LinkIcon,
  Image as ImageIcon
} from 'lucide-react'

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null
  }

  const addImage = () => {
    const url = window.prompt('URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    
    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-3 px-6 mb-4 bg-neutral-800 rounded-lg shadow-md">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-neutral-700 transition-colors ${editor.isActive('bold') ? 'bg-neutral-700 text-white' : 'text-neutral-300'}`}
        title="Bold"
      >
        <BoldIcon className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-neutral-700 transition-colors ${editor.isActive('italic') ? 'bg-neutral-700 text-white' : 'text-neutral-300'}`}
        title="Italic"
      >
        <ItalicIcon className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-neutral-700 transition-colors ${editor.isActive('underline') ? 'bg-neutral-700 text-white' : 'text-neutral-300'}`}
        title="Underline"
      >
        <UnderlineIcon className="w-5 h-5" />
      </button>
      <div className="mx-1 w-px h-6 bg-neutral-700" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-neutral-700 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-neutral-700 text-white' : 'text-neutral-300'}`}
        title="Heading 1"
      >
        <Heading1 className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-neutral-700 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-neutral-700 text-white' : 'text-neutral-300'}`}
        title="Heading 2"
      >
        <Heading2 className="w-5 h-5" />
      </button>
      <div className="mx-1 w-px h-6 bg-neutral-700" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-neutral-700 transition-colors ${editor.isActive('bulletList') ? 'bg-neutral-700 text-white' : 'text-neutral-300'}`}
        title="Bullet List"
      >
        <ListIcon className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-neutral-700 transition-colors ${editor.isActive('orderedList') ? 'bg-neutral-700 text-white' : 'text-neutral-300'}`}
        title="Ordered List"
      >
        <OrderedListIcon className="w-5 h-5" />
      </button>
      <div className="mx-1 w-px h-6 bg-neutral-700" />
      <button
        type="button"
        onClick={setLink}
        className={`p-2 rounded hover:bg-neutral-700 transition-colors ${editor.isActive('link') ? 'bg-neutral-700 text-white' : 'text-neutral-300'}`}
        title="Link"
      >
        <LinkIcon className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={addImage}
        className="p-2 rounded hover:bg-neutral-700 transition-colors text-neutral-300"
        title="Image"
      >
        <ImageIcon className="w-5 h-5" />
      </button>
    </div>
  )
}

const TiptapEditor = ({ content, onUpdate }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Underline,
      BulletList,
      OrderedList,
      Heading.configure({
        levels: [1, 2],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
    autofocus: 'end',
  })

  return (
    <div className="w-full h-full flex flex-col pt-4 px-6">
      <MenuBar editor={editor} />
      <EditorContent 
        editor={editor} 
        className="flex-1 px-6 py-4 bg-neutral-800/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-700 prose prose-invert prose-lg max-w-none min-h-[calc(100vh-200px)]" 
      />
    </div>
  )
}

export default TiptapEditor 
