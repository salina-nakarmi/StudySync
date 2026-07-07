import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Save, Undo, Redo,
  Search, ChevronDown, Scissors, Copy, Clipboard,
  Highlighter, X, Maximize2, Minimize2,
  Subscript, Superscript, Type, ZoomIn, ZoomOut, PenLine,
  RefreshCw, MousePointer, ChevronUp, Eye,
  FileText, LayoutGrid, Share2,
  MessageSquare, Mic,
  Image, Link, Bookmark, Quote, Calendar, Hash, Box,
  Palette, Square, Lock, Mail, Tag, Users, MapPin,
  Sparkles, Smartphone, RotateCw, BookOpen, Plus,
  CheckCircle2, XCircle, Video,
} from 'lucide-react';

const WORD_BLUE = '#2C76BA';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const fonts = [
  'Calibri', 'Arial', 'Arial Black', 'Arial Narrow', 'Cambria',
  'Candara', 'Century Gothic', 'Comic Sans MS', 'Consolas',
  'Courier New', 'Franklin Gothic Medium', 'Garamond', 'Georgia',
  'Helvetica', 'Impact', 'Palatino Linotype', 'Tahoma',
  'Times New Roman', 'Trebuchet MS', 'Verdana',
];

const fontSizes = ['8','9','10','11','12','14','16','18','20','22','24','26','28','36','48','72'];

const wordStyles = [
  { name: 'Normal',      preview: 'AaBbCcDd', weight: 'normal', size: '13px', color: '#323130' },
  { name: 'No Spacing',  preview: 'AaBbCcDd', weight: 'normal', size: '13px', color: '#323130' },
  { name: 'Heading 1',   preview: 'AaBb',     weight: 'bold',   size: '17px', color: '#2F5496' },
  { name: 'Heading 2',   preview: 'AaBb',     weight: 'bold',   size: '15px', color: '#2F5496' },
  { name: 'Heading 3',   preview: 'AaBb',     weight: 'bold',   size: '13px', color: '#1F3864' },
  { name: 'Title',       preview: 'AaBb',     weight: 'bold',   size: '20px', color: '#323130' },
  { name: 'Subtitle',    preview: 'AaBb',     weight: 'normal', size: '13px', color: '#595959' },
];

const styleSets = ['Basic', 'Affix', 'Lines', 'Ion', 'Minimalist', 'Shaded', 'Grid', 'Lines (Stylish)'];

const SmallBtn = ({ icon: Icon, label, onClick, active = false, children }) => (
  <button
    onClick={onClick}
    title={label}
    className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer transition-colors border
      ${active
        ? 'bg-blue-50 border-blue-400 text-blue-700'
        : 'border-transparent hover:bg-gray-100 text-gray-700'}`}
  >
    {children ?? (Icon && <Icon size={15} />)}
  </button>
);

const GroupDivider = () => (
  <div className="self-stretch w-px bg-gray-200 mx-1" />
);

const ExpandArrow = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" className="text-gray-400 hover:text-gray-700 cursor-pointer shrink-0">
    <path d="M1 1h4v1H2.7l3.15 3.15-.7.7L2 2.7V4H1V1zm9 9H6v-1h1.3L4.15 5.85l.7-.7L8 8.3V7h1v3z" fill="currentColor"/>
  </svg>
);

const RibbonGroup = ({ label, children }) => (
  <div className="flex flex-col shrink-0">
    <div className="flex items-center gap-1 px-1 py-1 flex-1">{children}</div>
    <div
      className="flex items-center justify-between pb-0.5 px-1"
      style={{ fontSize: '10px', borderTop: '1px solid #e5e7eb' }}
    >
      <span className="text-gray-500">{label}</span>
      <ExpandArrow />
    </div>
  </div>
);

const LargeBtn = ({ icon: Icon, glyph, label, hasDropdown = true, onClick, w = 58, iconSize = 22 }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center rounded px-1 py-1 hover:bg-gray-100 border border-transparent gap-0.5 text-center shrink-0"
    style={{ height: '60px', width: `${w}px` }}
  >
    {Icon && <Icon size={iconSize} className="text-gray-700" />}
    {!Icon && glyph && (
      <span className="font-serif text-gray-700" style={{ fontSize: `${iconSize}px`, lineHeight: 1 }}>{glyph}</span>
    )}
    <span className="text-[11px] text-gray-700 leading-tight flex items-center gap-0.5 justify-center">
      <span>{label}</span>{hasDropdown && <ChevronDown size={8} className="shrink-0" />}
    </span>
  </button>
);

const TextRowBtn = ({ icon: Icon, label, extra = '', onClick }) => (
  <button onClick={onClick} className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-gray-100 text-xs text-gray-700 whitespace-nowrap shrink-0">
    {Icon && <Icon size={12} className="text-gray-500 shrink-0" />}
    <span>{label}</span>
    {extra && <span className="text-gray-400 text-[11px] ml-1">{extra}</span>}
  </button>
);

const CheckRow = ({ label, checked = false }) => (
  <label className="flex items-center gap-1.5 px-1 py-0.5 text-xs text-gray-700 cursor-pointer whitespace-nowrap">
    <input type="checkbox" defaultChecked={checked} className="w-3 h-3" />
    {label}
  </label>
);

const RadioRow = ({ label, checked = false, name }) => (
  <label className="flex items-center gap-1.5 px-1 py-0.5 text-xs text-gray-700 cursor-pointer whitespace-nowrap">
    <input type="radio" name={name} defaultChecked={checked} className="w-3 h-3" />
    {label}
  </label>
);

const NumberField = ({ label, value, labelW = 64 }) => (
  <div className="flex items-center gap-1 text-xs text-gray-700">
    <span style={{ width: `${labelW}px` }} className="shrink-0">{label}</span>
    <div className="flex items-center border border-gray-300 rounded bg-white">
      <span className="px-1.5 text-xs w-10">{value}</span>
      <div className="flex flex-col border-l border-gray-300">
        <button className="px-0.5 hover:bg-gray-100"><ChevronUp size={8} /></button>
        <button className="px-0.5 hover:bg-gray-100"><ChevronDown size={8} /></button>
      </div>
    </div>
  </div>
);

export default function Docs({ embedded = false, documentId = null }) {
  const [activeTab, setActiveTab]           = useState('Home');
  const [fontFamily, setFontFamily]         = useState('Calibri');
  const [fontSize, setFontSize]             = useState('12');
  const [isBold, setIsBold]                 = useState(false);
  const [isItalic, setIsItalic]             = useState(false);
  const [isUnderline, setIsUnderline]       = useState(false);
  const [isStrike, setIsStrike]             = useState(false);
  const [textAlign, setTextAlign]           = useState('left');
  const [docTitle, setDocTitle]             = useState('Untitled Document');
  const [wordCount, setWordCount]           = useState(0);
  const [zoom, setZoom]                     = useState(100);
  const [activeStyle, setActiveStyle]       = useState('Normal');
  const [showFontDrop, setShowFontDrop]     = useState(false);
  const [showSizeDrop, setShowSizeDrop]     = useState(false);
  const [editingTitle, setEditingTitle]     = useState(false);

  // Connection and synchronization States
  const [currentDocId, setCurrentDocId]     = useState(documentId);
  const [comments, setComments]             = useState([]);
  const [isSaving, setIsSaving]             = useState(false);

  // Modal states
  const [showShareModal, setShowShareModal]         = useState(false);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal]   = useState(false);
  const [showImageModal, setShowImageModal]         = useState(false);
  const [showTableModal, setShowTableModal]         = useState(false);
  const [showLinkModal, setShowLinkModal]           = useState(false);

  // Feature data states
  const [textColor, setTextColor]                   = useState('#000000');
  const [highlightColor, setHighlightColor]         = useState('#FFFF00');
  const [shareLink, setShareLink]                   = useState('');
  const [collaborators, setCollaborators]           = useState([]);
  const [versions, setVersions]                     = useState([]);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [newCollaboratorRole, setNewCollaboratorRole] = useState('viewer');
  const [tableRows, setTableRows]                   = useState(3);
  const [tableCols, setTableCols]                   = useState(3);
  const [linkUrl, setLinkUrl]                       = useState('');
  const [linkText, setLinkText]                     = useState('');

  const editorRef    = useRef(null);
  const titleRef     = useRef(null);

  // Sync editor formatting state
  const syncState = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
    setIsUnderline(document.queryCommandState('underline'));
    setIsStrike(document.queryCommandState('strikeThrough'));
  };

  // Handle editor input: update word count and sync formatting state
  const handleEditorInput = useCallback(() => {
    const text = editorRef.current?.innerText ?? '';
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    syncState();
  }, []);

  // Load document and comments from backend on mount or ID swap
  useEffect(() => {
    if (currentDocId) {
      axios.get(`${API_BASE_URL}/documents/${currentDocId}`)
        .then(res => {
          const doc = res.data;
          setDocTitle(doc.title);
          if (editorRef.current) {
            editorRef.current.innerHTML = doc.content || '';
          }
          if (doc.font_family) setFontFamily(doc.font_family);
          if (doc.font_size) setFontSize(doc.font_size);
          handleEditorInput();
        })
        .catch(err => console.error("Error fetching document:", err));

      axios.get(`${API_BASE_URL}/documents/${currentDocId}/comments`)
        .then(res => setComments(res.data))
        .catch(err => console.error("Error fetching comments:", err));
    }
  }, [currentDocId, handleEditorInput]);

  // Persistent Save to Database (Create or Update dynamically)
  const saveDocument = useCallback(async () => {
    if (!editorRef.current) return;
    setIsSaving(true);
    const payload = {
      title: docTitle,
      content: editorRef.current.innerHTML,
      font_family: fontFamily,
      font_size: fontSize
    };

    try {
      if (currentDocId) {
        await axios.put(`${API_BASE_URL}/documents/${currentDocId}`, payload);
      } else {
        const res = await axios.post(`${API_BASE_URL}/documents`, payload);
        setCurrentDocId(res.data.id);
      }
    } catch (err) {
      console.error("Error synchronization document metrics:", err);
    } finally {
      setIsSaving(false);
    }
  }, [docTitle, fontFamily, fontSize, currentDocId]);

  // Debounced auto-save triggers whenever contents, titles or structural layouts shift
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (editorRef.current?.innerHTML || docTitle !== 'Untitled Document') {
        saveDocument();
      }
    }, 2000);
    return () => clearTimeout(saveTimeout);
  }, [docTitle, fontFamily, fontSize, saveDocument]);

  // Comment action triggers
  const handleAddComment = async () => {
    const text = prompt("Enter your comment text:");
    if (!text || !text.trim()) return;

    const selection = window.getSelection();
    const quotedText = selection ? selection.toString() : null;

    try {
      if (!currentDocId) await saveDocument();
      const res = await axios.post(`${API_BASE_URL}/documents/${currentDocId}/comments`, {
        text,
        quoted_text: quotedText,
        start_offset: 0,
        end_offset: 0
      });
      setComments([...comments, res.data]);
    } catch (err) {
      console.error("Could not post comment mapping layer:", err);
    }
  };

  // Font color handler
  const handleSetTextColor = (color) => {
    setTextColor(color);
    exec('foreColor', color);
  };

  // Highlight color handler
  const handleSetHighlightColor = (color) => {
    setHighlightColor(color);
    exec('backColor', color);
  };

  // Insert image handler
  const handleInsertImage = (imageUrl) => {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    if (editorRef.current) {
      editorRef.current.appendChild(img);
      editorRef.current.focus();
    }
  };

  // Insert table handler
  const handleInsertTable = () => {
    if (!editorRef.current) return;
    let table = '<table border="1" cellpadding="8" cellspacing="0" style="width:100%;border-collapse:collapse;"><tbody>';
    for (let i = 0; i < tableRows; i++) {
      table += '<tr>';
      for (let j = 0; j < tableCols; j++) {
        table += '<td style="padding:8px;border:1px solid #999;"></td>';
      }
      table += '</tr>';
    }
    table += '</tbody></table>';
    document.execCommand('insertHTML', false, table);
    setShowTableModal(false);
  };

  // Insert link handler
  const handleInsertLink = () => {
    if (!linkUrl.trim()) {
      alert('Please enter a URL');
      return;
    }
    exec('createLink', linkUrl);
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Share link handlers
  const handleGenerateShareLink = async () => {
    if (!currentDocId) return;
    try {
      const res = await axios.put(`${API_BASE_URL}/documents/${currentDocId}/share-link`, {
        enabled: true,
        role: 'viewer'
      });
      setShareLink(res.data.link || `${window.location.origin}/docs/${currentDocId}`);
    } catch (err) {
      console.error("Error generating share link:", err);
    }
  };

  const handleCopyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      alert('Share link copied to clipboard!');
    }
  };

  // Collaborator handlers
  const handleLoadCollaborators = async () => {
    if (!currentDocId) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/documents/${currentDocId}`);
      setCollaborators(res.data.collaborators || []);
    } catch (err) {
      console.error("Error loading collaborators:", err);
    }
  };

  const handleAddCollaborator = async () => {
    if (!newCollaboratorEmail.trim() || !currentDocId) return;
    try {
      await axios.post(`${API_BASE_URL}/documents/${currentDocId}/collaborators`, {
        email: newCollaboratorEmail,
        role: newCollaboratorRole
      });
      setNewCollaboratorEmail('');
      handleLoadCollaborators();
    } catch (err) {
      console.error("Error adding collaborator:", err);
      alert('Failed to add collaborator. Make sure the email is correct.');
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    if (!currentDocId) return;
    try {
      await axios.delete(`${API_BASE_URL}/documents/${currentDocId}/collaborators/${userId}`);
      handleLoadCollaborators();
    } catch (err) {
      console.error("Error removing collaborator:", err);
    }
  };

  // Version history handlers
  const handleLoadVersions = async () => {
    if (!currentDocId) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/documents/${currentDocId}/versions`);
      setVersions(res.data || []);
    } catch (err) {
      console.error("Error loading versions:", err);
    }
  };

  const handleSaveVersion = async () => {
    if (!currentDocId) return;
    try {
      await axios.post(`${API_BASE_URL}/documents/${currentDocId}/versions`);
      handleLoadVersions();
      alert('Version saved successfully!');
    } catch (err) {
      console.error("Error saving version:", err);
    }
  };

  const handleRevertVersion = async (versionId) => {
    if (!currentDocId) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/documents/${currentDocId}/versions/${versionId}/revert`);
      if (editorRef.current) {
        editorRef.current.innerHTML = res.data.content || '';
      }
      handleLoadVersions();
      alert('Document reverted to previous version!');
    } catch (err) {
      console.error("Error reverting version:", err);
    }
  };

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    syncState();
  };

  /* ── Home ribbon ──────────────────────────────────────────────── */
  const HomeRibbon = () => (
    <div className="flex items-stretch h-full">
      <RibbonGroup label="Clipboard">
        <div className="flex items-center gap-0.5">
          <button
            title="Paste (Ctrl+V)"
            onClick={() => exec('paste')}
            className="flex flex-col items-center justify-center rounded px-2 py-1 hover:bg-gray-300 border border-transparent h-[60px] w-[44px]"
          >
            <Clipboard size={28} className="text-gray-700" />
            <span className="text-[11px] text-gray-700 mt-0.5 flex items-center gap-0.5">
              Paste <ChevronDown size={8} />
            </span>
          </button>
          <div className="flex flex-col gap-0.5">
            <SmallBtn icon={Scissors} label="Cut (Ctrl+X)" onClick={() => exec('cut')} />
            <SmallBtn icon={Copy} label="Copy (Ctrl+C)" onClick={() => exec('copy')} />
            <SmallBtn icon={PenLine} label="Format Painter" />
          </div>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Font">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => { setShowFontDrop(p => !p); setShowSizeDrop(false); }}
                className="flex items-center gap-1 px-1.5 h-6 border border-gray-400 rounded bg-white hover:bg-gray-50 text-xs w-[112px] justify-between"
              >
                <span className="truncate" style={{ fontFamily }}>{fontFamily}</span>
                <ChevronDown size={10} className="text-gray-500 shrink-0" />
              </button>
              {showFontDrop && (
                <div className="absolute top-7 left-0 z-50 bg-white border border-gray-300 shadow-lg rounded max-h-52 overflow-y-auto w-44">
                  {fonts.map(f => (
                    <button
                      key={f}
                      onClick={() => { setFontFamily(f); exec('fontName', f); setShowFontDrop(false); }}
                      className={`w-full text-left px-3 py-1 text-xs hover:bg-blue-50 ${fontFamily === f ? 'bg-blue-100' : ''}`}
                      style={{ fontFamily: f }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => { setShowSizeDrop(p => !p); setShowFontDrop(false); }}
                className="flex items-center gap-1 px-1.5 h-6 border border-gray-400 rounded bg-white hover:bg-gray-50 text-xs w-12 justify-between"
              >
                <span>{fontSize}</span>
                <ChevronDown size={10} className="text-gray-500" />
              </button>
              {showSizeDrop && (
                <div className="absolute top-7 left-0 z-50 bg-white border border-gray-300 shadow-lg rounded max-h-52 overflow-y-auto w-16">
                  {fontSizes.map(s => (
                    <button
                      key={s}
                      onClick={() => { setFontSize(s); setShowSizeDrop(false); }}
                      className={`w-full text-left px-3 py-1 text-xs hover:bg-blue-50 ${fontSize === s ? 'bg-blue-100' : ''}`}
                    >{s}</button>
                  ))}
                </div>
              )}
            </div>

            <SmallBtn label="Increase Font Size" onClick={() => { const i = fontSizes.indexOf(fontSize); if (i < fontSizes.length - 1) setFontSize(fontSizes[i + 1]); }}>
              <span className="font-bold text-sm text-gray-700" style={{ fontSize: '13px' }}>A</span>
              <span className="text-gray-500" style={{ fontSize: '8px', marginTop: '-2px' }}>▲</span>
            </SmallBtn>
            <SmallBtn label="Decrease Font Size" onClick={() => { const i = fontSizes.indexOf(fontSize); if (i > 0) setFontSize(fontSizes[i - 1]); }}>
              <span className="font-bold text-sm text-gray-700" style={{ fontSize: '11px' }}>A</span>
              <span className="text-gray-500" style={{ fontSize: '8px', marginTop: '-2px' }}>▼</span>
            </SmallBtn>
            <SmallBtn icon={Type} label="Clear All Formatting" onClick={() => exec('removeFormat')} />
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => { setIsBold(p => !p); exec('bold'); }}
              title="Bold (Ctrl+B)"
              className={`w-7 h-7 flex items-center justify-center rounded font-bold text-sm border transition-colors
                ${isBold ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-transparent hover:bg-gray-300 text-gray-800'}`}
            >B</button>
            <button
              onClick={() => { setIsItalic(p => !p); exec('italic'); }}
              title="Italic (Ctrl+I)"
              className={`w-7 h-7 flex items-center justify-center rounded italic text-sm border transition-colors
                ${isItalic ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-transparent hover:bg-gray-300 text-gray-800'}`}
            >I</button>
            <div className="flex items-end gap-0">
              <button
                onClick={() => { setIsUnderline(p => !p); exec('underline'); }}
                title="Underline (Ctrl+U)"
                className={`w-7 h-7 flex flex-col items-center justify-center rounded text-sm border transition-colors
                  ${isUnderline ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-transparent hover:bg-gray-300 text-gray-800'}`}
              >
                <span className="underline">U</span>
              </button>
              <ChevronDown size={9} className="text-gray-500 mb-1 -ml-1" />
            </div>
            <button
              onClick={() => { setIsStrike(p => !p); exec('strikeThrough'); }}
              title="Strikethrough"
              className={`w-7 h-7 flex items-center justify-center rounded text-sm border transition-colors
                ${isStrike ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-transparent hover:bg-gray-300 text-gray-800'}`}
            >
              <span className="line-through">ab</span>
            </button>
            <SmallBtn icon={Subscript}   label="Subscript"   onClick={() => exec('subscript')} />
            <SmallBtn icon={Superscript} label="Superscript" onClick={() => exec('superscript')} />

            <div className="w-px h-5 bg-gray-300 mx-0.5" />

            <div className="flex items-center gap-0">
              <button title="Text Highlight Color" onClick={() => {
                const color = prompt("Enter highlight color (hex code, e.g., #FFFF00):", highlightColor);
                if (color) handleSetHighlightColor(color);
              }} className="flex flex-col items-center justify-center w-7 h-7 rounded hover:bg-gray-300 border border-transparent cursor-pointer">
                <Highlighter size={13} className="text-gray-700" />
                <div className="w-4 h-1 rounded-sm mt-0.5" style={{ backgroundColor: highlightColor }} />
              </button>
              <button onClick={() => {
                const colors = ['#FFFF00', '#00FF00', '#FF0000', '#0000FF', '#FFA500', '#FFC0CB'];
                const color = prompt(`Quick colors: ${colors.join(', ')}\n\nOr enter custom hex:`, '#FFFF00');
                if (color) handleSetHighlightColor(color);
              }} title="Highlight color options">
                <ChevronDown size={9} className="text-gray-500 -ml-1" />
              </button>
            </div>

            <div className="flex items-center gap-0">
              <button title="Font Color" onClick={() => {
                const color = prompt("Enter text color (hex code, e.g., #000000):", textColor);
                if (color) handleSetTextColor(color);
              }} className="flex flex-col items-center justify-center w-7 h-7 rounded hover:bg-gray-300 border border-transparent cursor-pointer">
                <span className="font-bold text-gray-800" style={{ fontSize: '13px', lineHeight: 1 }}>A</span>
                <div className="w-4 h-1 rounded-sm mt-0.5" style={{ backgroundColor: textColor }} />
              </button>
              <button onClick={() => {
                const colors = ['#000000', '#FF0000', '#0000FF', '#008000', '#FFFFFF', '#808080'];
                const color = prompt(`Quick colors: ${colors.join(', ')}\n\nOr enter custom hex:`, '#000000');
                if (color) handleSetTextColor(color);
              }} title="Font color options">
                <ChevronDown size={9} className="text-gray-500 -ml-1" />
              </button>
            </div>
          </div>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Paragraph">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-0.5">
            <SmallBtn icon={List}         label="Bullets"            onClick={() => exec('insertUnorderedList')} />
            <SmallBtn icon={ListOrdered}  label="Numbering"          onClick={() => exec('insertOrderedList')} />
            <SmallBtn label="Multilevel List">
              <svg width="14" height="14" viewBox="0 0 14 14">
                <rect x="0" y="1.5" width="2" height="1.5" fill="#555" />
                <rect x="3.5" y="1.5" width="9" height="1.5" fill="#555" />
                <rect x="2" y="5.5" width="1.5" height="1.5" fill="#555" />
                <rect x="5" y="5.5" width="8" height="1.5" fill="#555" />
                <rect x="4" y="9.5" width="1.5" height="1.5" fill="#555" />
                <rect x="7" y="9.5" width="6" height="1.5" fill="#555" />
              </svg>
            </SmallBtn>
            <SmallBtn label="Decrease Indent" onClick={() => exec('outdent')}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <rect x="1" y="2" width="12" height="1.5" fill="#555" />
                <rect x="5" y="6" width="8" height="1.5" fill="#555" />
                <polygon points="4,5.5 1,6.75 4,8" fill="#555" />
                <rect x="1" y="10" width="12" height="1.5" fill="#555" />
              </svg>
            </SmallBtn>
            <SmallBtn label="Increase Indent" onClick={() => exec('indent')}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <rect x="1" y="2" width="12" height="1.5" fill="#555" />
                <rect x="5" y="6" width="8" height="1.5" fill="#555" />
                <polygon points="1,5.5 4,6.75 1,8" fill="#555" />
                <rect x="1" y="10" width="12" height="1.5" fill="#555" />
              </svg>
            </SmallBtn>
            <SmallBtn label="Sort">
              <svg width="14" height="14" viewBox="0 0 14 14">
                <text x="0" y="8" fontSize="6" fill="#555" fontWeight="bold">A</text>
                <text x="4" y="12" fontSize="9" fill="#555">Z</text>
                <line x1="11" y1="1" x2="11" y2="11" stroke="#555" strokeWidth="1.5" />
                <polygon points="11,13 9,10 13,10" fill="#555" />
              </svg>
            </SmallBtn>
            <SmallBtn label="Show/Hide Paragraph Marks">
              <span className="font-bold text-gray-700" style={{ fontSize: '14px' }}>¶</span>
            </SmallBtn>
          </div>

          <div className="flex items-center gap-0.5">
            <SmallBtn icon={AlignLeft}    label="Align Left (Ctrl+L)"  onClick={() => { setTextAlign('left');    exec('justifyLeft');   }} active={textAlign === 'left'} />
            <SmallBtn icon={AlignCenter}  label="Center (Ctrl+E)"      onClick={() => { setTextAlign('center');  exec('justifyCenter'); }} active={textAlign === 'center'} />
            <SmallBtn icon={AlignRight}   label="Align Right (Ctrl+R)" onClick={() => { setTextAlign('right');   exec('justifyRight');  }} active={textAlign === 'right'} />
            <SmallBtn icon={AlignJustify} label="Justify (Ctrl+J)"     onClick={() => { setTextAlign('justify'); exec('justifyFull');   }} active={textAlign === 'justify'} />

            <SmallBtn label="Line and Paragraph Spacing">
              <svg width="14" height="14" viewBox="0 0 14 14">
                <line x1="4" y1="3" x2="13" y2="3" stroke="#555" strokeWidth="1.5" />
                <line x1="4" y1="7" x2="13" y2="7" stroke="#555" strokeWidth="1.5" />
                <line x1="4" y1="11" x2="13" y2="11" stroke="#555" strokeWidth="1.5" />
                <polygon points="1.5,1 3,4 0,4" fill="#555" />
                <polygon points="1.5,13 3,10 0,10" fill="#555" />
              </svg>
            </SmallBtn>

            <button title="Shading" className="flex flex-col items-center justify-center w-7 h-7 rounded hover:bg-gray-300 border border-transparent cursor-pointer">
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#BDD7EE' }} />
              <ChevronDown size={8} className="text-gray-500 mt-0.5" />
            </button>

            <SmallBtn label="Borders">
              <svg width="14" height="14" viewBox="0 0 14 14">
                <rect x="1" y="1" width="12" height="12" stroke="#555" strokeWidth="1.5" fill="none" />
                <line x1="5" y1="1" x2="5" y2="13" stroke="#bbb" strokeWidth="0.5" />
                <line x1="9" y1="1" x2="9" y2="13" stroke="#bbb" strokeWidth="0.5" />
                <line x1="1" y1="5" x2="13" y2="5" stroke="#bbb" strokeWidth="0.5" />
                <line x1="1" y1="9" x2="13" y2="9" stroke="#bbb" strokeWidth="0.5" />
              </svg>
            </SmallBtn>
          </div>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Styles">
        <div className="flex items-center gap-1">
          <div className="flex gap-1" style={{ maxWidth: '340px', overflowX: 'hidden' }}>
            {wordStyles.map(s => (
              <button
                key={s.name}
                onClick={() => setActiveStyle(s.name)}
                className={`flex flex-col items-start px-2 py-1 rounded border shrink-0 w-[70px]
                  ${activeStyle === s.name
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-400 bg-white'}`}
              >
                <span style={{ fontWeight: s.weight, fontSize: s.size, color: s.color, lineHeight: 1.2 }}>{s.preview}</span>
                <span className="text-gray-500 truncate w-full mt-0.5" style={{ fontSize: '9px' }}>{s.name}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-0.5 ml-0.5">
            <button className="w-5 h-4 flex items-center justify-center hover:bg-gray-300 rounded"><ChevronUp size={10} /></button>
            <button className="w-5 h-4 flex items-center justify-center hover:bg-gray-300 rounded"><ChevronDown size={10} /></button>
            <button className="w-5 h-5 flex items-center justify-center hover:bg-gray-300 rounded text-xs">⊞</button>
          </div>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Editing">
        <div className="flex flex-col gap-0.5">
          {[
            { Icon: Search,       label: 'Find',    extra: '▾' },
            { Icon: RefreshCw,    label: 'Replace', extra: '' },
            { Icon: MousePointer, label: 'Select',  extra: '▾' },
          // eslint-disable-next-line no-unused-vars
          ].map(({ Icon: IconComp, label, extra }) => (
            <button
              key={label}
              title={label}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-gray-100 text-xs text-gray-700 whitespace-nowrap"
            >
              <IconComp size={13} className="text-gray-500" />
              <span>{label}</span>
              {extra && <span className="text-gray-400 text-[11px]">{extra}</span>}
            </button>
          ))}
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Voice">
        <button
          title="Dictate"
          className="flex flex-col items-center justify-center rounded px-3 py-1 hover:bg-gray-100 transition-colors h-15.5 w-13"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center mb-0.5" style={{ backgroundColor: '#e8f0fe' }}>
            <Mic size={18} style={{ color: WORD_BLUE }} />
          </div>
          <span className="text-[11px] text-gray-700 flex items-center gap-0.5">
            Dictate <ChevronDown size={8} />
          </span>
        </button>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Editor">
        <button className="flex flex-col items-center justify-center rounded px-3 py-1 h-15.5 w-13 opacity-50 cursor-not-allowed">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="4" width="20" height="20" rx="3" stroke="#666" strokeWidth="1.5" fill="none"/>
              <path d="M9 10h10M9 14h7M9 18h5" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-[11px] text-gray-500">Editor</span>
        </button>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Add-ins">
        <button className="flex flex-col items-center justify-center rounded px-3 py-1 h-15.5 w-13 opacity-50 cursor-not-allowed">
          <div className="w-8 h-8 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="3" y="3" width="10" height="10" rx="1.5" stroke="#666" strokeWidth="1.5" fill="none"/>
              <rect x="15" y="3" width="10" height="10" rx="1.5" stroke="#666" strokeWidth="1.5" fill="none"/>
              <rect x="3" y="15" width="10" height="10" rx="1.5" stroke="#666" strokeWidth="1.5" fill="none"/>
              <rect x="15" y="15" width="10" height="10" rx="1.5" stroke="#666" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
          <span className="text-[11px] text-gray-500">Add-ins</span>
        </button>
      </RibbonGroup>
    </div>
  );

  /* ── Insert ribbon ────────────────────────────────────────────── */
  const InsertRibbon = () => (
    <div className="flex items-stretch h-full">
      <RibbonGroup label="Pages">
        <div className="flex flex-col gap-0.5 justify-center">
          <TextRowBtn icon={BookOpen} label="Cover Page" extra="▾" />
          <TextRowBtn icon={FileText} label="Blank Page" />
          <TextRowBtn icon={LayoutGrid} label="Page Break" />
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Tables">
        <LargeBtn icon={LayoutGrid} label="Table" w={48} onClick={() => setShowTableModal(true)} />
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Illustrations">
        <div className="flex items-center gap-px">
          <LargeBtn icon={Image} label="Pictures" w={46} onClick={() => setShowImageModal(true)} />
          <button className="flex flex-col items-center justify-center rounded px-1 py-1 hover:bg-gray-100 gap-0.5 shrink-0" style={{ height: '60px', width: '44px' }}>
            <svg width="20" height="20" viewBox="0 0 20 20">
              <polygon points="3,16 7,9 11,16" fill="none" stroke="#374151" strokeWidth="1.3" />
              <circle cx="14" cy="6" r="2.6" fill="none" stroke="#374151" strokeWidth="1.3" />
              <rect x="9" y="11" width="5" height="5" fill="none" stroke="#374151" strokeWidth="1.3" />
            </svg>
            <span className="text-[11px] text-gray-700 flex items-center gap-0.5">Shapes <ChevronDown size={8} /></span>
          </button>
          <LargeBtn icon={Sparkles} label="Icons" w={40} hasDropdown={false} />
          <button className="flex flex-col items-center justify-center rounded px-1 py-1 hover:bg-gray-100 gap-0.5 shrink-0" style={{ height: '60px', width: '52px' }}>
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M10 2L17 6V14L10 18L3 14V6Z" fill="none" stroke="#374151" strokeWidth="1.3"/>
              <path d="M10 2L10 18" stroke="#374151" strokeWidth="0.8" strokeDasharray="2,1.2"/>
              <path d="M3 6L17 6" stroke="#374151" strokeWidth="0.8" strokeDasharray="2,1.2"/>
              <path d="M3 14L17 14" stroke="#374151" strokeWidth="0.8" strokeDasharray="2,1.2"/>
            </svg>
            <span className="text-[11px] text-gray-700 flex items-center gap-0.5">3D Models <ChevronDown size={8} /></span>
          </button>
          <button className="flex flex-col items-center justify-center rounded px-1 py-1 hover:bg-gray-100 gap-0.5 shrink-0" style={{ height: '60px', width: '46px' }}>
            <svg width="20" height="20" viewBox="0 0 20 20">
              <circle cx="10" cy="4" r="2" fill="none" stroke="#374151" strokeWidth="1.2" />
              <circle cx="4" cy="14" r="2" fill="none" stroke="#374151" strokeWidth="1.2" />
              <circle cx="16" cy="14" r="2" fill="none" stroke="#374151" strokeWidth="1.2" />
              <line x1="10" y1="6" x2="4" y2="12" stroke="#374151" strokeWidth="1.2" />
              <line x1="10" y1="6" x2="16" y2="12" stroke="#374151" strokeWidth="1.2" />
            </svg>
            <span className="text-[11px] text-gray-700 flex items-center gap-0.5">SmartArt <ChevronDown size={8} /></span>
          </button>
          <button className="flex flex-col items-center justify-center rounded px-1 py-1 hover:bg-gray-100 gap-0.5 shrink-0" style={{ height: '60px', width: '40px' }}>
            <svg width="20" height="20" viewBox="0 0 20 20">
              <line x1="2" y1="17" x2="18" y2="17" stroke="#374151" strokeWidth="1.3" />
              <rect x="4" y="11" width="3" height="6" fill="#374151" />
              <rect x="9" y="7" width="3" height="10" fill="#374151" />
              <rect x="14" y="3" width="3" height="14" fill="#374151" />
            </svg>
            <span className="text-[11px] text-gray-700">Chart</span>
          </button>
          <button className="flex flex-col items-center justify-center rounded px-1 py-1 hover:bg-gray-100 gap-0.5 shrink-0" style={{ height: '60px', width: '52px' }}>
            <svg width="20" height="20" viewBox="0 0 20 20">
              <rect x="1" y="3" width="18" height="13" rx="1.5" fill="none" stroke="#374151" strokeWidth="1.3"/>
              <rect x="3" y="5" width="14" height="9" fill="#e5e7eb"/>
              <circle cx="7" cy="8" r="1.2" fill="#9ca3af"/>
              <path d="M3 12L6 9L9 11L13 7L17 12" stroke="#9ca3af" strokeWidth="1" fill="none"/>
            </svg>
            <span className="text-[11px] text-gray-700 flex items-center gap-0.5">Screenshot <ChevronDown size={8} /></span>
          </button>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Media">
        <LargeBtn icon={Video} label="Online Videos" hasDropdown={false} w={58} />
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Links">
        <div className="flex flex-col gap-0.5 justify-center">
          <TextRowBtn icon={Link} label="Link" extra="▾" onClick={() => setShowLinkModal(true)} />
          <TextRowBtn icon={Bookmark} label="Bookmark" />
          <TextRowBtn icon={Quote} label="Cross-reference" />
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Comments">
        <LargeBtn icon={MessageSquare} label="Comment" hasDropdown={false} w={52} onClick={handleAddComment} />
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Header & Footer">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={ChevronUp} label="Header" w={44} />
          <LargeBtn icon={ChevronDown} label="Footer" w={44} />
          <LargeBtn icon={Hash} label="Page Number" w={52} />
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Text">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={Type} label="Text Box" w={46} />
          <div className="flex flex-col gap-0.5 justify-center">
            <TextRowBtn icon={FileText} label="Quick Parts" extra="▾" />
            <TextRowBtn icon={PenLine} label="WordArt" extra="▾" />
          </div>
          <div className="flex flex-col gap-0.5 justify-center">
            <TextRowBtn label="Drop Cap" extra="▾" />
            <TextRowBtn icon={PenLine} label="Signature Line" extra="▾" />
            <TextRowBtn icon={Calendar} label="Date & Time" />
            <TextRowBtn icon={Box} label="Object" extra="▾" />
          </div>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Symbols">
        <div className="flex flex-col gap-0.5 justify-center">
          <button className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-gray-100 text-xs text-gray-700 whitespace-nowrap shrink-0">
            <span className="font-serif text-gray-700 w-3 text-center" style={{ fontSize: '13px' }}>∑</span>
            <span>Equation</span>
            <span className="text-gray-400 text-[11px] ml-1">▾</span>
          </button>
          <button className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-gray-100 text-xs text-gray-700 whitespace-nowrap shrink-0">
            <span className="font-serif text-gray-700 w-3 text-center" style={{ fontSize: '13px' }}>Ω</span>
            <span>Symbol</span>
            <span className="text-gray-400 text-[11px] ml-1">▾</span>
          </button>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="eSignature">
        <button
          className="flex flex-col items-center justify-center rounded px-1.5 py-1 hover:bg-gray-100 gap-0.5 shrink-0"
          style={{ height: '60px', width: '64px' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <rect x="2" y="4" width="20" height="16" rx="1.5" fill="none" stroke="#374151" strokeWidth="1.3"/>
            <path d="M5 15C7 13 9 11 11 12.5C13 14 12 17 14 17C16 17 17 14 20 13" stroke="#374151" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
            <path d="M15 7L17 5L19 7L13 13L10 14L11 11Z" fill="none" stroke="#374151" strokeWidth="1.1"/>
          </svg>
          <span className="text-[11px] text-gray-700 text-center leading-tight">eSignature<br/>fields</span>
        </button>
      </RibbonGroup>
    </div>
  );

  /* ── Design ribbon ───────────────────────────────────────────── */
  const DesignRibbon = () => (
    <div className="flex items-stretch h-full">
      <RibbonGroup label="Document Formatting">
        <div className="flex items-center gap-1">
          <div className="flex flex-col">
            <button className="w-5 h-6 flex items-center justify-center hover:bg-gray-100 rounded"><ChevronUp size={10} /></button>
            <button className="w-5 h-6 flex items-center justify-center hover:bg-gray-100 rounded"><ChevronDown size={10} /></button>
          </div>
          <div className="flex gap-1">
            {styleSets.slice(0, 5).map((s, i) => (
              <button
                key={s}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded border shrink-0
                  ${i === 0 ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-400 bg-white'}`}
              >
                <span className="text-[11px] font-bold text-gray-700">Aa</span>
                <span className="text-[7px] text-gray-500 mt-0.5 truncate w-12 text-center">{s}</span>
              </button>
            ))}
          </div>
          <button className="w-5 h-14 flex items-center justify-center hover:bg-gray-100 rounded text-xs text-gray-500">⊞</button>
          <div className="flex items-center gap-0.5 ml-1">
            <TextRowBtn icon={Palette} label="Colors" extra="▾" />
            <TextRowBtn icon={Type} label="Fonts" extra="▾" />
            <TextRowBtn icon={AlignJustify} label="Paragraph Spacing" extra="▾" />
            <TextRowBtn icon={Sparkles} label="Effects" extra="▾" />
            <TextRowBtn icon={Save} label="Set as Default" onClick={saveDocument} />
          </div>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Page Background">
        <div className="flex items-center gap-0.5">
          <button className="flex flex-col items-center justify-center rounded px-1 py-1 hover:bg-gray-100 gap-0.5 shrink-0" style={{ height: '60px', width: '56px' }}>
            <span className="text-gray-400 font-bold" style={{ fontSize: '16px' }}>Aa</span>
            <span className="text-[11px] text-gray-700 flex items-center gap-0.5">Watermark <ChevronDown size={8} /></span>
          </button>
          <button className="flex flex-col items-center justify-center rounded px-1 py-1 hover:bg-gray-100 gap-0.5 shrink-0" style={{ height: '60px', width: '56px' }}>
            <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#BDD7EE' }} />
            <span className="text-[11px] text-gray-700 flex items-center gap-0.5 mt-0.5">Page Color <ChevronDown size={8} /></span>
          </button>
          <LargeBtn icon={Square} label="Page Borders" hasDropdown={false} w={56} />
        </div>
      </RibbonGroup>
    </div>
  );

  /* ── Layout ribbon ───────────────────────────────────────────── */
  const LayoutRibbon = () => (
    <div className="flex items-stretch h-full">
      <RibbonGroup label="Page Setup">
        <div className="flex items-center gap-0.5">
          <button className="flex flex-col items-center justify-center rounded px-1 py-1 hover:bg-gray-100 gap-0.5 shrink-0" style={{ height: '60px', width: '50px' }}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <rect x="2" y="1" width="14" height="16" fill="none" stroke="#374151" strokeWidth="1.2" />
              <line x1="5" y1="1" x2="5" y2="17" stroke="#374151" strokeWidth="1" strokeDasharray="1.5,1.5" />
              <line x1="13" y1="1" x2="13" y2="17" stroke="#374151" strokeWidth="1" strokeDasharray="1.5,1.5" />
            </svg>
            <span className="text-[11px] text-gray-700 flex items-center gap-0.5">Margins <ChevronDown size={8} /></span>
          </button>
          <LargeBtn icon={Smartphone} label="Orientation" w={56} />
          <LargeBtn icon={FileText} label="Size" w={46} />
          <LargeBtn icon={LayoutGrid} label="Columns" w={52} />
          <div className="flex items-center gap-0.5">
            <TextRowBtn icon={Scissors} label="Breaks" extra="▾" />
            <TextRowBtn icon={ListOrdered} label="Line Numbers" extra="▾" />
            <TextRowBtn icon={Type} label="Hyphenation" extra="▾" />
          </div>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Paragraph">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <NumberField label="Indent Left" value="0&quot;" labelW={72} />
            <NumberField label="Indent Right" value="0&quot;" labelW={72} />
          </div>
          <div className="flex flex-col gap-1">
            <NumberField label="Spacing Before" value="0 pt" labelW={84} />
            <NumberField label="Spacing After" value="8 pt" labelW={84} />
          </div>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Arrange">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={MousePointer} label="Position" w={50} />
          <LargeBtn icon={LayoutGrid} label="Wrap Text" w={54} />
          <div className="flex items-center gap-0.5">
            <TextRowBtn icon={ChevronUp} label="Bring Forward" extra="▾" />
            <TextRowBtn icon={ChevronDown} label="Send Backward" extra="▾" />
            <TextRowBtn icon={MousePointer} label="Selection Pane" />
          </div>
          <LargeBtn icon={AlignLeft} label="Align" w={46} />
          <button className="flex flex-col items-center justify-center rounded px-1 py-1 hover:bg-gray-100 gap-0.5 shrink-0" style={{ height: '60px', width: '46px' }}>
            <svg width="18" height="18" viewBox="0 0 18 18">
              <rect x="2" y="2" width="9" height="9" fill="none" stroke="#374151" strokeWidth="1.2" />
              <rect x="7" y="7" width="9" height="9" fill="none" stroke="#374151" strokeWidth="1.2" />
            </svg>
            <span className="text-[11px] text-gray-700 flex items-center gap-0.5">Group <ChevronDown size={8} /></span>
          </button>
          <LargeBtn icon={RotateCw} label="Rotate" w={46} />
        </div>
      </RibbonGroup>
    </div>
  );

  /* ── References ribbon ─────────────────────────────────────────── */
  const ReferencesRibbon = () => (
    <div className="flex items-stretch h-full">
      <RibbonGroup label="Table of Contents">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={List} label="Table of Contents" w={66} />
          <div className="flex items-center gap-0.5">
            <TextRowBtn icon={Plus} label="Add Text" extra="▾" />
            <TextRowBtn icon={RefreshCw} label="Update Table" />
          </div>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Footnotes">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={FileText} label="Insert Footnote" hasDropdown={false} w={58} />
          <LargeBtn icon={FileText} label="Insert Endnote" hasDropdown={false} w={58} />
          <div className="flex items-center gap-0.5">
            <TextRowBtn label="Next Footnote" extra="▾" />
            <TextRowBtn label="Show Notes" />
          </div>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Citations &amp; Bibliography">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={Quote} label="Insert Citation" w={58} />
          <div className="flex items-center gap-0.5">
            <TextRowBtn label="Manage Sources" />
            <TextRowBtn label="Style: APA" extra="▾" />
          </div>
          <LargeBtn icon={BookOpen} label="Bibliography" w={58} />
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Captions">
        <div className="flex items-center gap-0.5">
          <TextRowBtn icon={MessageSquare} label="Insert Caption" />
          <TextRowBtn icon={LayoutGrid} label="Insert Table of Figures" />
          <TextRowBtn icon={RefreshCw} label="Update Table" />
          <TextRowBtn icon={Quote} label="Cross-reference" />
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Index">
        <div className="flex items-center gap-0.5">
          <div className="flex items-center gap-0.5">
            <TextRowBtn label="Mark Entry" />
            <TextRowBtn label="Update Index" />
          </div>
          <LargeBtn icon={List} label="Insert Index" w={56} />
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Table of Authorities">
        <div className="flex items-center gap-0.5">
          <div className="flex items-center gap-0.5">
            <TextRowBtn label="Mark Citation" />
            <TextRowBtn label="Update Table" />
          </div>
          <LargeBtn icon={List} label="Insert Table of Authorities" w={72} />
        </div>
      </RibbonGroup>
    </div>
  );

  /* ── Mailings ribbon ─────────────────────────────────────────────── */
  const MailingsRibbon = () => (
    <div className="flex items-stretch h-full">
      <RibbonGroup label="Create">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={Mail} label="Envelopes" hasDropdown={false} w={56} />
          <LargeBtn icon={Tag} label="Labels" hasDropdown={false} w={48} />
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Start Mail Merge">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={Mail} label="Start Mail Merge" w={64} />
          <LargeBtn icon={Users} label="Select Recipients" w={64} />
          <LargeBtn icon={LayoutGrid} label="Edit Recipient List" hasDropdown={false} w={64} />
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Write &amp; Insert Fields">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={Highlighter} label="Highlight Merge Fields" hasDropdown={false} w={72} />
          <LargeBtn icon={MapPin} label="Address Block" w={56} />
          <LargeBtn icon={MessageSquare} label="Greeting Line" w={56} />
          <LargeBtn icon={Plus} label="Insert Merge Field" w={64} />
          <div className="flex items-center gap-0.5">
            <TextRowBtn label="Rules" extra="▾" />
            <TextRowBtn label="Match Fields" />
            <TextRowBtn label="Update Labels" />
          </div>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Preview Results">
        <div className="flex items-center gap-1">
          <LargeBtn icon={Eye} label="Preview Results" hasDropdown={false} w={64} />
          <div className="flex items-center gap-0.5">
            <SmallBtn label="First Record"><span className="text-xs">|◀</span></SmallBtn>
            <SmallBtn label="Previous Record"><span className="text-xs">◀</span></SmallBtn>
            <span className="text-xs text-gray-600 px-1 w-5 text-center">1</span>
            <SmallBtn label="Next Record"><span className="text-xs">▶</span></SmallBtn>
            <SmallBtn label="Last Record"><span className="text-xs">▶|</span></SmallBtn>
          </div>
          <div className="flex items-center gap-0.5">
            <TextRowBtn icon={Search} label="Find Recipient" />
            <TextRowBtn label="Auto Check for Errors" />
          </div>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Finish">
        <LargeBtn icon={CheckCircle2} label="Finish & Merge" w={64} />
      </RibbonGroup>
    </div>
  );

  /* ── Review ribbon ─────────────────────────────────────────────── */
  const ReviewRibbon = () => (
    <div className="flex items-stretch h-full">
      <RibbonGroup label="Proofing">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={CheckCircle2} label="Spelling &amp; Grammar" hasDropdown={false} w={72} />
          <div className="flex items-center gap-0.5">
            <TextRowBtn icon={BookOpen} label="Thesaurus" />
            <TextRowBtn icon={Hash} label="Word Count" />
          </div>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Accessibility">
        <LargeBtn icon={Users} label="Check Accessibility" hasDropdown={false} w={66} />
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Language">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={BookOpen} label="Translate" w={54} />
          <LargeBtn icon={BookOpen} label="Language" w={52} />
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Comments">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={MessageSquare} label="New Comment" hasDropdown={false} w={62} onClick={handleAddComment} />
          <div className="flex items-center gap-0.5">
            <TextRowBtn label="Delete" extra="▾" />
            <TextRowBtn icon={ChevronUp} label="Previous" />
            <TextRowBtn icon={ChevronDown} label="Next" />
          </div>
          <TextRowBtn icon={Eye} label="Show Comments" />
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Tracking">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={PenLine} label="Track Changes" w={64} />
          <div className="flex items-center gap-0.5">
            <TextRowBtn label="All Markup" extra="▾" />
            <TextRowBtn label="Show Markup" extra="▾" />
            <TextRowBtn label="Reviewing Pane" extra="▾" />
          </div>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Changes">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={CheckCircle2} label="Accept" w={48} />
          <LargeBtn icon={XCircle} label="Reject" w={48} />
          <div className="flex items-center gap-0.5">
            <TextRowBtn icon={ChevronUp} label="Previous" />
            <TextRowBtn icon={ChevronDown} label="Next" />
          </div>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Version History">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={RotateCw} label="Version History" hasDropdown={false} w={72} onClick={() => {
            setShowVersionsModal(true);
            handleLoadVersions();
          }} />
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Compare">
        <div className="flex items-center gap-0.5">
          <button className="flex flex-col items-center justify-center rounded px-1 py-1 hover:bg-gray-100 gap-0.5 shrink-0" style={{ height: '60px', width: '54px' }}>
            <span className="text-gray-700 font-bold" style={{ fontSize: '16px' }}>⇄</span>
            <span className="text-[11px] text-gray-700 flex items-center gap-0.5">Compare <ChevronDown size={8} /></span>
          </button>
          <LargeBtn icon={Lock} label="Protect" w={48} />
        </div>
      </RibbonGroup>
    </div>
  );

  /* ── View ribbon ─────────────────────────────────────────────── */
  const ViewRibbon = () => {
    const views = [
      { icon: BookOpen,   label: 'Read Mode' },
      { icon: FileText,   label: 'Print Layout', active: true },
      { icon: LayoutGrid, label: 'Web Layout' },
      { icon: List,       label: 'Outline' },
      { icon: PenLine,    label: 'Draft' },
    ];
    return (
      <div className="flex items-stretch h-full">
        <RibbonGroup label="Views">
          <div className="flex items-center gap-1">
            {views.map(v => (
              <button
                key={v.label}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded border shrink-0
                  ${v.active ? 'border-blue-400 bg-blue-50' : 'border-transparent hover:bg-gray-100'}`}
              >
                <v.icon size={17} className="text-gray-700" />
                <span className="text-[9px] text-gray-700 mt-0.5 text-center leading-tight">{v.label}</span>
              </button>
            ))}
          </div>
        </RibbonGroup>

        <GroupDivider />

        <RibbonGroup label="Immersive">
          <div className="flex items-center gap-0.5">
            <LargeBtn icon={BookOpen} label="Immersive Reader" hasDropdown={false} w={64} />
            <LargeBtn icon={Eye} label="Focus" hasDropdown={false} w={46} />
          </div>
        </RibbonGroup>

        <GroupDivider />

        <RibbonGroup label="Page Movement">
          <div className="flex flex-col gap-0.5">
            <RadioRow label="Vertical" name="pagemove" checked />
            <RadioRow label="Side to Side" name="pagemove" />
          </div>
        </RibbonGroup>

        <GroupDivider />

        <RibbonGroup label="Show">
          <div className="flex flex-col gap-0.5">
            <CheckRow label="Ruler" />
            <CheckRow label="Gridlines" />
            <CheckRow label="Navigation Pane" />
          </div>
        </RibbonGroup>

        <GroupDivider />

        <RibbonGroup label="Zoom">
          <div className="flex items-center gap-0.5">
            <LargeBtn icon={ZoomIn} label="Zoom" hasDropdown={false} w={46} />
            <div className="flex items-center gap-0.5">
              <TextRowBtn label="100%" />
              <TextRowBtn label="One Page" />
            </div>
            <div className="flex items-center gap-0.5">
              <TextRowBtn label="Multiple Pages" />
              <TextRowBtn label="Page Width" />
            </div>
          </div>
        </RibbonGroup>

        <GroupDivider />

        <RibbonGroup label="Window">
          <div className="flex items-center gap-0.5">
            <LargeBtn icon={Square} label="New Window" hasDropdown={false} w={56} />
            <LargeBtn icon={LayoutGrid} label="Arrange All" hasDropdown={false} w={56} />
            <button className="flex flex-col items-center justify-center rounded px-1 py-1 hover:bg-gray-100 gap-0.5 shrink-0" style={{ height: '60px', width: '46px' }}>
              <svg width="18" height="18" viewBox="0 0 18 18">
                <rect x="1" y="1" width="16" height="16" fill="none" stroke="#374151" strokeWidth="1.2" />
                <line x1="9" y1="1" x2="9" y2="17" stroke="#374151" strokeWidth="1.2" />
              </svg>
              <span className="text-[11px] text-gray-700">Split</span>
            </button>
            <div className="flex items-center gap-0.5">
              <TextRowBtn label="View Side by Side" />
              <TextRowBtn label="Synchronous Scrolling" />
              <TextRowBtn label="Reset Window Position" />
            </div>
            <div className="w-[122px] shrink-0">
              <TextRowBtn label="Switch Windows" extra="▾" />
            </div>
          </div>
        </RibbonGroup>

        <GroupDivider />

        <RibbonGroup label="Macros">
          <LargeBtn icon={Box} label="Macros" w={48} />
        </RibbonGroup>
      </div>
    );
  };

  /* ── Help ribbon ─────────────────────────────────────────────── */
  const HelpRibbon = () => (
    <div className="flex items-stretch h-full">
      <RibbonGroup label="Help">
        <div className="flex items-center gap-0.5">
          <LargeBtn icon={BookOpen} label="Help" hasDropdown={false} w={46} />
          <LargeBtn icon={MessageSquare} label="Contact Support" hasDropdown={false} w={66} />
          <LargeBtn icon={CheckCircle2} label="Feedback" hasDropdown={false} w={50} />
          <LargeBtn icon={Sparkles} label="Show Training" hasDropdown={false} w={60} />
        </div>
      </RibbonGroup>
    </div>
  );

  /* ── Ruler ────────────────────────────────────────────────────── */
  const Ruler = () => (
    <div className="flex items-center bg-gray-100 border-b border-gray-300 select-none" style={{ height: '22px' }}>
      <div className="w-[54px] h-full bg-gray-100 border-r border-gray-300 shrink-0 flex items-center justify-center">
        <div className="w-3.5 h-3.5 border border-gray-400 rounded-sm text-gray-500" style={{ fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◫</div>
      </div>
      <div className="flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(to right, #d1d5db 0%, #d1d5db 15%, #f9fafb 15%, #f9fafb 85%, #d1d5db 85%, #d1d5db 100%)' }}>
        <svg width="100%" height="22" preserveAspectRatio="none">
          {Array.from({ length: 82 }, (_, i) => (
            <line
              key={i}
              x1={`${(i / 80) * 100}%`} y1={i % 10 === 0 ? '4' : i % 5 === 0 ? '8' : '13'}
              x2={`${(i / 80) * 100}%`} y2="22"
              stroke="#9ca3af" strokeWidth="1"
            />
          ))}
          {Array.from({ length: 9 }, (_, i) => (
            <text key={i} x={`${((i + 1) / 10) * 100}%`} y="10" fontSize="8" fill="#6b7280" textAnchor="middle">{i + 1}</text>
          ))}
        </svg>
        <div className="absolute top-0 left-[15%]">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <polygon points="0,0 12,0 6,8" fill="#6b7280" />
          </svg>
        </div>
        <div className="absolute top-0 right-[15%]">
          <svg width="12" height="12" viewBox="0 0 12 12">
            <polygon points="0,0 12,0 6,8" fill="#6b7280" />
          </svg>
        </div>
      </div>
    </div>
  );

  const handleZoom = (delta) => setZoom(z => Math.min(500, Math.max(10, z + delta)));

  const renderRibbon = () => {
    if (activeTab === 'File') return (
      <div className="flex items-center gap-3 px-4 h-full">
        {['New', 'Open', 'Print', 'Share', 'Export', 'Close'].map(item => (
          <button key={item} className="flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-gray-200 text-sm text-gray-700">{item}</button>
        ))}
        <button onClick={saveDocument} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 text-sm text-white font-medium hover:bg-blue-700">Save Changes</button>
      </div>
    );
    if (activeTab === 'Home')       return <HomeRibbon />;
    if (activeTab === 'Insert')     return <InsertRibbon />;
    if (activeTab === 'Design')     return <DesignRibbon />;
    if (activeTab === 'Layout')     return <LayoutRibbon />;
    if (activeTab === 'References') return <ReferencesRibbon />;
    if (activeTab === 'Mailings')   return <MailingsRibbon />;
    if (activeTab === 'Review')     return <ReviewRibbon />;
    if (activeTab === 'View')       return <ViewRibbon />;
    if (activeTab === 'Help')       return <HelpRibbon />;
    return null;
  };

  const PAPER_W = 816;
  const PAPER_H = 1056;

  return (
    <div className={`flex flex-col overflow-hidden select-none ${embedded ? 'h-full w-full' : 'h-screen w-screen'}`} style={{ fontFamily: 'Segoe UI, sans-serif' }}>

      {/* ── Title bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0 bg-white border-b border-gray-100 px-3" style={{ height: '40px' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 flex items-center justify-center rounded shrink-0">
            <span className="font-black text-2xl leading-none" style={{ color: WORD_BLUE, letterSpacing: '-2px' }}>W</span>
          </div>

          <div className="flex items-center gap-1 ml-1">
            <span className="text-xs text-gray-600">AutoSave</span>
            <div className="flex items-center gap-1">
              <div className="w-7 h-3.5 bg-blue-600 rounded-full flex items-center justify-end px-0.5 cursor-pointer">
                <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
              </div>
              <span className="text-xs text-gray-500">On</span>
            </div>
          </div>

          <button title="Save (Ctrl+S)" onClick={saveDocument} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
            <Save size={15} className="text-gray-600" />
          </button>

          <div className="flex items-center">
            <button title="Undo (Ctrl+Z)" onClick={() => exec('undo')} className="w-7 h-7 flex items-center justify-center rounded-l hover:bg-gray-100 transition-colors">
              <Undo size={15} className="text-gray-600" />
            </button>
            <button className="w-4 h-7 flex items-center justify-center rounded-r hover:bg-gray-100 transition-colors border-l border-gray-200">
              <ChevronDown size={9} className="text-gray-500" />
            </button>
          </div>

          <button title="Redo (Ctrl+Y)" onClick={() => exec('redo')} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
            <Redo size={15} className="text-gray-600" />
          </button>

          <button className="w-5 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors">
            <ChevronDown size={10} className="text-gray-500" />
          </button>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          {editingTitle ? (
            <input
              ref={titleRef}
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              onBlur={() => { setEditingTitle(false); saveDocument(); }}
              onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
              autoFocus
              className="text-sm text-gray-800 border border-blue-400 rounded px-2 py-0.5 outline-none min-w-48"
            />
          ) : (
            <button onClick={() => setEditingTitle(true)} className="text-sm text-gray-700 hover:bg-gray-100 rounded px-2 py-0.5 transition-colors whitespace-nowrap">
              {docTitle} — Word
            </button>
          )}

          <span className="text-[11px] text-gray-400 ml-2 italic">
            {isSaving ? "Saving..." : "Saved to cloud"}
          </span>
        </div>

        <div className="flex-1 flex justify-center px-6">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5 w-full max-w-sm border border-gray-200 hover:border-gray-300 transition-colors">
            <Search size={13} className="text-gray-500 shrink-0" />
            <input placeholder="Search" className="bg-transparent text-sm outline-none flex-1 text-gray-600 placeholder-gray-400 w-0 min-w-0" />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer shrink-0" style={{ backgroundColor: WORD_BLUE }}>
            DU
          </div>
          <div className="w-px h-5 bg-gray-200 mx-1" />
          {[
            { Icon: Minimize2, label: 'Minimize', danger: false },
            { Icon: Maximize2, label: 'Maximize', danger: false },
            { Icon: X,         label: 'Close',    danger: true  },
          // eslint-disable-next-line no-unused-vars
          ].map(({ Icon: IconComp, label, danger }) => (
            <button key={label} title={label}
              className={`w-8 h-7 flex items-center justify-center rounded transition-colors
                ${danger ? 'hover:bg-red-500 hover:text-white text-gray-600' : 'hover:bg-gray-200 text-gray-600'}`}>
              <IconComp size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Ribbon tab bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0 bg-white border-b border-gray-200" style={{ height: '32px' }}>
        <div className="flex items-stretch h-full">
          <button
            onClick={() => setActiveTab('File')}
            className="px-4 h-full flex items-center text-sm font-medium text-white transition-colors shrink-0"
            style={{ backgroundColor: activeTab === 'File' ? '#1e5a9a' : WORD_BLUE }}
          >
            File
          </button>
          {['Home','Insert','Design','Layout','References','Mailings','Review','View','Help'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 h-full flex items-center text-sm transition-colors border-b-2 whitespace-nowrap
                ${activeTab === tab
                  ? 'border-blue-600 text-blue-700 font-medium'
                  : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 pr-3">
          <button onClick={handleAddComment} className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
            <MessageSquare size={12} /> Comments ({comments.length})
          </button>
          <button onClick={() => { setShowCollaboratorsModal(true); handleLoadCollaborators(); }} className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
            <Eye size={12} /> Editing <ChevronDown size={10} />
          </button>
          <button onClick={() => { setShowShareModal(true); handleGenerateShareLink(); }} className="flex items-center gap-1.5 px-3 py-1 text-xs text-white rounded font-medium transition-opacity hover:opacity-90 shrink-0" style={{ backgroundColor: WORD_BLUE }}>
            <Share2 size={12} /> Share
          </button>
        </div>
      </div>

      {/* ── Ribbon content ─────────────────────────────────────── */}
      <div
        className="shrink-0 border-b border-gray-200 overflow-hidden bg-white w-full"
        style={{ minHeight: '88px' }}
        onClick={() => { setShowFontDrop(false); setShowSizeDrop(false); }}
      >
        <div className="flex items-stretch h-full px-1 w-full" style={{ minHeight: '88px' }}>
          {renderRibbon()}
        </div>
      </div>

      {/* ── Ruler ──────────────────────────────────────────────── */}
      <Ruler />

      {/* ── Document area ──────────────────────────────────────── */}
      <div
        className="flex-1 overflow-auto flex flex-col items-center py-6 select-text"
        style={{ background: '#e0e0e0' }}
        onClick={() => { setShowFontDrop(false); setShowSizeDrop(false); }}
      >
        <div style={{
          width: `${PAPER_W * zoom / 100}px`,
          minHeight: `${PAPER_H * zoom / 100}px`,
          position: 'relative',
          flexShrink: 0,
        }}>
          <div
            style={{
              width: `${PAPER_W}px`,
              minHeight: `${PAPER_H}px`,
              padding: '96px 120px',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
              transformOrigin: 'top left',
              transform: `scale(${zoom / 100})`,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              onKeyUp={syncState}
              onMouseUp={syncState}
              className="outline-none w-full"
              style={{
                fontFamily,
                fontSize: `${parseInt(fontSize)}px`,
                lineHeight: '1.5',
                color: '#000',
                minHeight: `${PAPER_H - 192}px`,
              }}
              data-placeholder="Start typing your document..."
            />
            <style>{`
              [contenteditable]:empty:before {
                content: attr(data-placeholder);
                color: #bbb;
                pointer-events: none;
              }
            `}</style>
          </div>
        </div>
      </div>

      {/* ── Status bar ─────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 shrink-0 text-white"
        style={{ backgroundColor: WORD_BLUE, height: '24px', fontSize: '11px' }}
      >
        <div className="flex items-center gap-4">
          <span>Page 1 of 1</span>
          <span className="opacity-60">|</span>
          <span>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
          <span className="opacity-60">|</span>
          <span>English (US)</span>
          <span className="opacity-60">|</span>
          <button className="hover:bg-white/15 rounded px-1">Spelling &amp; Grammar Check</button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            {[
              { icon: Eye,        label: 'Read Mode' },
              { icon: FileText,   label: 'Print Layout' },
              { icon: LayoutGrid, label: 'Web Layout' },
            // eslint-disable-next-line no-unused-vars
            ].map(({ icon: IconComp, label }) => (
              <button key={label} title={label} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20">
                <IconComp size={12} className="text-white" />
              </button>
            ))}
          </div>

          <div className="w-px h-3.5 bg-white/30" />

          <div className="flex items-center gap-1">
            <button onClick={() => handleZoom(-10)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20">
              <ZoomOut size={11} className="text-white" />
            </button>
            <div className="relative flex items-center" style={{ width: '80px' }}>
              <div className="w-full h-px bg-white/40" />
              <div
                className="absolute h-3 w-3 bg-white rounded-full shadow cursor-pointer"
                style={{ left: `${((zoom - 10) / 490) * 100}%`, transform: 'translateX(-50%)' }}
              />
            </div>
            <button onClick={() => handleZoom(10)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/20">
              <ZoomIn size={11} className="text-white" />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="hover:bg-white/15 rounded px-1 min-w-[36px] text-center"
            >
              {zoom}%
            </button>
          </div>
        </div>
      </div>

      {/* ── Share Link Modal ─────────────────────────────────────── */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Share Document</h3>
              <button onClick={() => setShowShareModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Share Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded bg-gray-50"
                />
                <button
                  onClick={handleCopyShareLink}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="mr-2" />
                <span className="text-sm">Anyone with the link can view</span>
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Collaborators Modal ─────────────────────────────────────── */}
      {showCollaboratorsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Collaborators</h3>
              <button onClick={() => setShowCollaboratorsModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="mb-4 pb-4 border-b">
              <div className="flex gap-2 mb-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={newCollaboratorEmail}
                  onChange={e => setNewCollaboratorEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded"
                />
                <select
                  value={newCollaboratorRole}
                  onChange={e => setNewCollaboratorRole(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
              </div>
              <button
                onClick={handleAddCollaborator}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Collaborator
              </button>
            </div>

            <div className="mb-4">
              <h4 className="font-medium mb-2">Current Collaborators</h4>
              {collaborators.length === 0 ? (
                <p className="text-sm text-gray-500">No collaborators yet</p>
              ) : (
                <div className="space-y-2">
                  {collaborators.map(collab => (
                    <div key={collab.user_id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">{collab.user_id}</p>
                        <p className="text-xs text-gray-500">{collab.can_edit ? 'Editor' : 'Viewer'}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveCollaborator(collab.user_id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCollaboratorsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Insert Image Modal ─────────────────────────────────────── */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Insert Image</h3>
              <button onClick={() => setShowImageModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Image URL</label>
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    handleInsertImage(e.target.value);
                    setShowImageModal(false);
                  }
                }}
                id="imageUrl"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const input = document.getElementById('imageUrl');
                  if (input.value) {
                    handleInsertImage(input.value);
                    setShowImageModal(false);
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Insert
              </button>
              <button
                onClick={() => setShowImageModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Insert Table Modal ─────────────────────────────────────── */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Insert Table</h3>
              <button onClick={() => setShowTableModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Rows: <span className="text-blue-600">{tableRows}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Columns: <span className="text-blue-600">{tableCols}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={tableCols}
                onChange={(e) => setTableCols(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  handleInsertTable();
                  setShowTableModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Insert Table
              </button>
              <button
                onClick={() => setShowTableModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Insert Link Modal ─────────────────────────────────────── */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Insert Link</h3>
              <button onClick={() => setShowLinkModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">URL</label>
              <input
                type="text"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Display Text</label>
              <input
                type="text"
                placeholder="Click here"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleInsertLink}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Insert Link
              </button>
              <button
                onClick={() => setShowLinkModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Version History Modal ─────────────────────────────────────── */}
      {showVersionsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Version History</h3>
              <button onClick={() => setShowVersionsModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>

            <button
              onClick={handleSaveVersion}
              className="w-full mb-4 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save Current Version
            </button>

            {versions.length === 0 ? (
              <p className="text-sm text-gray-500">No versions yet</p>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <div key={version.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium">Version {version.version_number}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(version.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {version.change_summary && (
                      <p className="text-xs text-gray-600 mb-2">{version.change_summary}</p>
                    )}
                    <button
                      onClick={() => handleRevertVersion(version.id)}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                    >
                      Revert to this version
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowVersionsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}