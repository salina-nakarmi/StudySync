import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from "framer-motion";
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
  CheckCircle2, XCircle, Video
} from 'lucide-react';
import {
  ArrowDownTrayIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  HeartIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PlusIcon,
  ShareIcon,
  UserPlusIcon,
  UsersIcon,
  XMarkIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import {
  BookmarkIcon as BookmarkIconSolid,
  HeartIcon as HeartIconSolid
} from "@heroicons/react/24/solid";
import { useAuth, useUser } from "@clerk/clerk-react";
import Navbar from "../components/Navbar";
import { communityService } from "../services/community_services";
import { friendsService } from "../services/friends_service";
import AddPostModal from "../components/AddPostModal";

const WORD_BLUE = '#2C76BA';

const fonts = [
  'Calibri', 'Arial', 'Arial Black', 'Arial Narrow', 'Cambria',
  'Candara', 'Century Gothic', 'Comic Sans MS', 'Consolas',
  'Courier New', 'Franklin Gothic Medium', 'Garamond', 'Georgia',
  'Helvetica', 'Impact', 'Palatino Linotype', 'Tahoma',
  'Times New Roman', 'Trebuchet MS', 'Verdana'
];

const fontSizes = ['8','9','10','11','12','14','16','18','20','22','24','26','28','36','48','72'];

const wordStyles = [
  { name: 'Normal',      preview: 'AaBbCcDd', weight: 'normal', size: '13px', color: '#323130' },
  { name: 'No Spacing',  preview: 'AaBbCcDd', weight: 'normal', size: '13px', color: '#323130' },
  { name: 'Heading 1',   preview: 'AaBb',     weight: 'bold',   size: '17px', color: '#2F5496' },
  { name: 'Heading 2',   preview: 'AaBb',     weight: 'bold',   size: '15px', color: '#2F5496' },
  { name: 'Heading 3',   preview: 'AaBb',     weight: 'bold',   size: '13px', color: '#1F3864' },
  { name: 'Title',       preview: 'AaBb',     weight: 'bold',   size: '20px', color: '#323130' },
  { name: 'Subtitle',    preview: 'AaBb',     weight: 'normal', size: '13px', color: '#595959' }
];

const styleSets = ['Basic', 'Affix', 'Lines', 'Ion', 'Minimalist', 'Shaded', 'Grid', 'Lines (Stylish)'];

const marginPresets = [
  { name: 'Normal',   values: { top: 1,   right: 1,    bottom: 1,   left: 1    } },
  { name: 'Narrow',   values: { top: 0.5, right: 0.5,  bottom: 0.5, left: 0.5  } },
  { name: 'Moderate', values: { top: 1,   right: 0.75, bottom: 1,   left: 0.75 } },
  { name: 'Wide',     values: { top: 1,   right: 2,    bottom: 1,   left: 2    } }
];

const lineSpacingOptions = ['1.0', '1.15', '1.5', '2.0', '2.5', '3.0'];

const fontColors = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#FFFFFF',
  '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF',
  '#9900FF', '#FF00FF', '#E06666', '#F6B26B', '#93C47D', '#76A5AF', '#6D9EEB', '#8E7CC3'
];

const highlightColors = [
  '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#0000FF', '#FF0000',
  '#000080', '#008080', '#808000', '#808080', '#C0C0C0', '#FFFFFF'
];

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

const NumberField = ({ label, value, unit = '"', onIncrement, onDecrement, labelW = 64 }) => (
  <div className="flex items-center gap-1 text-xs text-gray-700">
    <span style={{ width: `${labelW}px` }} className="shrink-0">{label}</span>
    <div className="flex items-center border border-gray-300 rounded bg-white">
      <span className="px-1.5 text-xs w-10">{value}{unit}</span>
      <div className="flex flex-col border-l border-gray-300">
        <button type="button" onClick={onIncrement} className="px-0.5 hover:bg-gray-100"><ChevronUp size={8} /></button>
        <button type="button" onClick={onDecrement} className="px-0.5 hover:bg-gray-100"><ChevronDown size={8} /></button>
      </div>
    </div>
  </div>
);

const DropdownPanel = ({ open, anchorRef, onClose, width = 176, align = 'left', offset = 4, children }) => {
  const panelRef = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + offset, left: align === 'right' ? rect.right - width : rect.left });
    }
  }, [open, anchorRef, align, width, offset]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        anchorRef.current && !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open, onClose, anchorRef]);

  if (!open || !pos) return null;
  return createPortal(
    <div
      ref={panelRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width, zIndex: 9999 }}
      className="bg-white border border-gray-300 shadow-lg rounded"
    >
      {children}
    </div>,
    document.body
  );
};

export function Docs({ embedded = false, isMaximized = false, onMaximize, onMinimize, onClose }) {
  const [activeTab, setActiveTab]           = useState('Home');
  const [fontFamily, setFontFamily]         = useState('Calibri');
  const [fontSize, setFontSize]             = useState('12');
  const [fontSizeDraft, setFontSizeDraft]   = useState('12');
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

  const [pageMargins, setPageMargins]       = useState({ top: 1, right: 1, bottom: 1, left: 1 });
  const [showMarginsDrop, setShowMarginsDrop] = useState(false);
  const [lineSpacing, setLineSpacing]       = useState('1.5');
  const [showSpacingDrop, setShowSpacingDrop] = useState(false);
  const [indentLeft, setIndentLeft]         = useState(0);
  const [indentRight, setIndentRight]       = useState(0);
  const [spacingBefore, setSpacingBefore]   = useState(0);
  const [spacingAfter, setSpacingAfter]     = useState(8);

  const [showTableDrop, setShowTableDrop]   = useState(false);
  const [tableHover, setTableHover]         = useState({ r: -1, c: -1 });

  const [fontColor, setFontColor]           = useState('#FF0000');
  const [highlightColor, setHighlightColor] = useState('#FFFF00');
  const [showFontColorDrop, setShowFontColorDrop] = useState(false);
  const [showHighlightDrop, setShowHighlightDrop] = useState(false);
  const fontColorBtnRef = useRef(null);
  const highlightBtnRef = useRef(null);

  const [pageIds, setPageIds]               = useState([0]);
  const [currentPageDisplay, setCurrentPageDisplay] = useState(1);
  const nextPageIdRef = useRef(1);
  const pageRefs      = useRef(new Map());
  const activePageIdRef = useRef(0);
  const pendingPageWorkRef = useRef(null);

  const titleRef     = useRef(null);
  const fontFamilyBtnRef = useRef(null);
  const fontSizeBtnRef   = useRef(null);
  const marginsBtnRef    = useRef(null);
  const spacingBtnRef    = useRef(null);
  const tableBtnRef      = useRef(null);
  const savedSelectionRef = useRef(null);

  const registerPageRef = (id, el) => {
    if (el) pageRefs.current.set(id, el);
  };

  const getActiveEditor = () =>
    pageRefs.current.get(activePageIdRef.current) || pageRefs.current.get(pageIds[0]);

  const setActivePage = (id) => {
    activePageIdRef.current = id;
    const idx = pageIds.indexOf(id);
    if (idx !== -1) setCurrentPageDisplay(idx + 1);
  };

  const placeCaretAtStart = (el) => {
    el.focus();
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const recomputeWordCount = () => {
    let total = 0;
    pageRefs.current.forEach(el => {
      const text = el?.innerText ?? '';
      total += text.trim().split(/\s+/).filter(Boolean).length;
    });
    setWordCount(total);
  };

  useEffect(() => {
    const pending = pendingPageWorkRef.current;
    if (!pending) return;
    pendingPageWorkRef.current = null;
    if (pending.multi) {
      pending.multi.forEach(({ id, html }) => {
        const el = pageRefs.current.get(id);
        if (el) el.innerHTML = html;
      });
      const focusEl = pageRefs.current.get(pending.focusId);
      if (focusEl) { placeCaretAtStart(focusEl); setActivePage(pending.focusId); }
    } else {
      const el = pageRefs.current.get(pending.id);
      if (el) el.innerHTML = pending.html;
      if (pending.focus !== false && el) { placeCaretAtStart(el); setActivePage(pending.id); }
    }
    recomputeWordCount();
  }, [pageIds]);

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    getActiveEditor()?.focus();
    syncState();
  };

  const saveEditorSelection = () => {
    const sel = window.getSelection();
    const editor = getActiveEditor();
    if (sel && sel.rangeCount > 0 && editor && editor.contains(sel.anchorNode)) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreEditorSelection = () => {
    const sel = window.getSelection();
    const editor = getActiveEditor();
    const liveSelectionValid = sel && sel.rangeCount > 0 && !sel.isCollapsed &&
      editor && editor.contains(sel.anchorNode);
    if (liveSelectionValid) return;
    const range = savedSelectionRef.current;
    if (!range) return;
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const syncState = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
    setIsUnderline(document.queryCommandState('underline'));
    setIsStrike(document.queryCommandState('strikeThrough'));
  };

  const handleEditorInput = (id) => {
    if (id !== undefined) activePageIdRef.current = id;
    recomputeWordCount();
    syncState();
  };

  const ensureEditorSelection = (editor) => {
    if (!editor) return;
    const sel = window.getSelection();
    const validRange = sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode);
    if (validRange) return;
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const insertHTMLAtCursor = (html) => {
    const editor = getActiveEditor();
    if (!editor) return;
    editor.focus();
    ensureEditorSelection(editor);
    document.execCommand('insertHTML', false, html);
    handleEditorInput(activePageIdRef.current);
  };

  const getSelectedBlock = () => {
    const editor = getActiveEditor();
    if (!editor) return null;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return editor;
    let node = sel.getRangeAt(0).commonAncestorContainer;
    if (node.nodeType === 3) node = node.parentNode;
    const blockTags = ['P', 'DIV', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'];
    while (node && node !== editor) {
      if (blockTags.includes(node.tagName)) return node;
      node = node.parentNode;
    }
    return editor;
  };

  const splitActivePageAtCursor = () => {
    const id = activePageIdRef.current;
    const editor = pageRefs.current.get(id);
    if (!editor) return null;
    editor.focus();
    ensureEditorSelection(editor);
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return { id, remainderHTML: '<p><br></p>' };
    const range = sel.getRangeAt(0);
    let remainderHTML = '<p><br></p>';
    try {
      const extractRange = document.createRange();
      extractRange.setStart(range.endContainer, range.endOffset);
      extractRange.setEnd(editor, editor.childNodes.length);
      const frag = extractRange.extractContents();
      const wrapper = document.createElement('div');
      wrapper.appendChild(frag);
      const extracted = wrapper.innerHTML.trim();
      if (extracted) remainderHTML = extracted;
    } catch (e) { /* fallback */ }
    if (!editor.innerHTML.trim()) editor.innerHTML = '<p><br></p>';
    return { id, remainderHTML };
  };

  const insertPageAfter = (afterId, html, focus = true) => {
    setPageIds(ids => {
      const idx = ids.indexOf(afterId);
      const newId = nextPageIdRef.current++;
      const next = [...ids];
      next.splice(idx + 1, 0, newId);
      pendingPageWorkRef.current = { id: newId, html, focus };
      return next;
    });
  };

  const insertPageBreak = () => {
    const split = splitActivePageAtCursor();
    if (!split) return;
    insertPageAfter(split.id, split.remainderHTML, true);
    handleEditorInput(split.id);
  };

  const insertBlankPage = () => {
    const split = splitActivePageAtCursor();
    if (!split) return;
    setPageIds(ids => {
      const idx = ids.indexOf(split.id);
      const blankId = nextPageIdRef.current++;
      const contId = nextPageIdRef.current++;
      const next = [...ids];
      next.splice(idx + 1, 0, blankId, contId);
      pendingPageWorkRef.current = {
        multi: [
          { id: blankId, html: '<p><br></p>' },
          { id: contId, html: split.remainderHTML },
        ],
        focusId: blankId
      };
      return next;
    });
    handleEditorInput(split.id);
  };

  const insertCoverPage = () => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const html =
      '<div style="padding:110px 0 50px;text-align:center;">' +
        '<div style="font-size:34px;font-weight:600;color:#1F3864;letter-spacing:0.3px;margin-bottom:14px;">Document Title</div>' +
        '<div style="font-size:16px;color:#595959;margin-bottom:70px;">Subtitle goes here</div>' +
        `<div style="font-size:12px;color:#595959;">${today}</div>` +
      '</div>';
    setPageIds(ids => {
      const coverId = nextPageIdRef.current++;
      pendingPageWorkRef.current = { id: coverId, html, focus: false };
      return [coverId, ...ids];
    });
  };

  const applyFontColor = (color) => {
    setFontColor(color);
    setShowFontColorDrop(false);
    const editor = getActiveEditor();
    if (!editor) return;
    editor.focus();
    restoreEditorSelection();
    document.execCommand('foreColor', false, color);
    handleEditorInput(activePageIdRef.current);
  };

  const applyHighlight = (color) => {
    setHighlightColor(color);
    setShowHighlightDrop(false);
    const editor = getActiveEditor();
    if (!editor) return;
    editor.focus();
    restoreEditorSelection();
    if (!document.execCommand('hiliteColor', false, color)) {
      document.execCommand('backColor', false, color);
    }
    handleEditorInput(activePageIdRef.current);
  };

  const applyStyle = (styleName) => {
    setActiveStyle(styleName);
    const style = wordStyles.find(s => s.name === styleName);
    if (!style) return;
    const editor = getActiveEditor();
    if (!editor) return;
    editor.focus();
    const headingMatch = styleName.match(/^Heading (\d)$/);
    const tag = headingMatch ? `h${headingMatch[1]}` : 'p';
    document.execCommand('formatBlock', false, `<${tag}>`);
    const block = getSelectedBlock();
    if (block) {
      block.style.fontWeight = style.weight;
      block.style.fontSize = style.size;
      block.style.color = style.color;
      block.style.marginTop = styleName === 'No Spacing' ? '0' : '';
      block.style.marginBottom = styleName === 'No Spacing' ? '0' : '';
    }
    handleEditorInput(activePageIdRef.current);
  };

  const insertTableGrid = (rows, cols) => {
    setShowTableDrop(false);
    setTableHover({ r: -1, c: -1 });
    let rowsHtml = '';
    for (let r = 0; r < rows; r++) {
      let cellsHtml = '';
      for (let c = 0; c < cols; c++) {
        cellsHtml += '<td style="border:1px solid #999;padding:6px 8px;min-width:56px;height:24px;vertical-align:top;"><br></td>';
      }
      rowsHtml += `<tr>${cellsHtml}</tr>`;
    }
    const html = `<table style="border-collapse:collapse;width:100%;margin:10px 0;">${rowsHtml}</table><p><br></p>`;
    insertHTMLAtCursor(html);
  };

  const applyFontSize = (size) => {
    setFontSize(size);
    setFontSizeDraft(size);
    setShowSizeDrop(false);
    const editor = getActiveEditor();
    if (!editor) return;
    editor.focus();
    restoreEditorSelection();
    document.execCommand('fontSize', false, '7');
    editor.querySelectorAll('font[size="7"]').forEach(el => {
      el.removeAttribute('size');
      el.style.fontSize = `${size}px`;
    });
  };

  const commitFontSize = (raw) => {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n)) { setFontSizeDraft(fontSize); return; }
    applyFontSize(String(Math.min(400, Math.max(1, n))));
  };

  const stepFontSize = (dir) => {
    const current = parseInt(fontSize, 10) || 12;
    const i = fontSizes.findIndex(s => parseInt(s, 10) === current);
    const next = i !== -1
      ? (dir > 0 ? fontSizes[Math.min(i + 1, fontSizes.length - 1)] : fontSizes[Math.max(i - 1, 0)])
      : String(Math.min(400, Math.max(1, current + dir)));
    if (next !== fontSize) applyFontSize(next);
  };

  const applyLineSpacing = (value) => {
    setLineSpacing(value);
    setShowSpacingDrop(false);
    const block = getSelectedBlock();
    if (block) block.style.lineHeight = value;
    getActiveEditor()?.focus();
  };

  const setParaSpacing = (which, value) => {
    const next = Math.max(0, value);
    const block = getSelectedBlock();
    if (which === 'before') {
      setSpacingBefore(next);
      if (block) block.style.marginTop = `${next}pt`;
    } else {
      setSpacingAfter(next);
      if (block) block.style.marginBottom = `${next}pt`;
    }
    getActiveEditor()?.focus();
  };

  const adjustParaSpacing = (which, delta) => {
    setParaSpacing(which, (which === 'before' ? spacingBefore : spacingAfter) + delta);
  };

  const adjustIndent = (side, delta) => {
    const block = getSelectedBlock();
    if (side === 'left') {
      const next = Math.max(0, Math.round((indentLeft + delta) * 100) / 100);
      setIndentLeft(next);
      if (block) block.style.marginLeft = `${next}in`;
    } else {
      const next = Math.max(0, Math.round((indentRight + delta) * 100) / 100);
      setIndentRight(next);
      if (block) block.style.marginRight = `${next}in`;
    }
    getActiveEditor()?.focus();
  };

  const applyMarginPreset = (values) => {
    setPageMargins(values);
    setShowMarginsDrop(false);
  };

  const adjustPageMargin = (side, delta) => {
    setPageMargins(m => ({ ...m, [side]: Math.max(0, Math.round((m[side] + delta) * 100) / 100) }));
  };

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
            <div>
              <button
                ref={fontFamilyBtnRef}
                onClick={() => { setShowFontDrop(p => !p); setShowSizeDrop(false); }}
                className="flex items-center gap-1 px-1.5 h-6 border border-gray-400 rounded bg-white hover:bg-gray-50 text-xs w-[112px] justify-between"
              >
                <span className="truncate" style={{ fontFamily }}>{fontFamily}</span>
                <ChevronDown size={10} className="text-gray-500 shrink-0" />
              </button>
              <DropdownPanel open={showFontDrop} anchorRef={fontFamilyBtnRef} onClose={() => setShowFontDrop(false)} width={176}>
                <div className="max-h-52 overflow-y-auto">
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
              </DropdownPanel>
            </div>

            <div>
              <div ref={fontSizeBtnRef} className="flex items-center h-6 border border-gray-400 rounded bg-white hover:bg-gray-50 w-14 overflow-hidden">
                <input
                  type="text"
                  inputMode="numeric"
                  title="Font Size"
                  value={fontSizeDraft}
                  onMouseDown={saveEditorSelection}
                  onChange={(e) => { if (/^\d{0,3}$/.test(e.target.value)) setFontSizeDraft(e.target.value); }}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
                    if (e.key === 'Escape') { e.preventDefault(); e.currentTarget.value = fontSize; setFontSizeDraft(fontSize); e.currentTarget.blur(); }
                  }}
                  onBlur={(e) => commitFontSize(e.target.value)}
                  className="w-9 h-full px-1.5 text-xs outline-none bg-transparent"
                />
                <button
                  title="Font Size options"
                  onClick={() => { setShowSizeDrop(p => !p); setShowFontDrop(false); }}
                  className="h-full px-1 flex items-center justify-center hover:bg-gray-100 border-l border-gray-300 shrink-0"
                >
                  <ChevronDown size={10} className="text-gray-500" />
                </button>
              </div>
              <DropdownPanel open={showSizeDrop} anchorRef={fontSizeBtnRef} onClose={() => setShowSizeDrop(false)} width={64}>
                <div className="max-h-52 overflow-y-auto">
                  {fontSizes.map(s => (
                    <button
                      key={s}
                      onClick={() => applyFontSize(s)}
                      className={`w-full text-left px-3 py-1 text-xs hover:bg-blue-50 ${fontSize === s ? 'bg-blue-100' : ''}`}
                    >{s}</button>
                  ))}
                </div>
              </DropdownPanel>
            </div>

            <SmallBtn label="Increase Font Size" onClick={() => stepFontSize(1)}>
              <span className="font-bold text-sm text-gray-700" style={{ fontSize: '13px' }}>A</span>
              <span className="text-gray-500" style={{ fontSize: '8px', marginTop: '-2px' }}>▲</span>
            </SmallBtn>
            <SmallBtn label="Decrease Font Size" onClick={() => stepFontSize(-1)}>
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

            <div ref={highlightBtnRef}>
              <button
                title="Text Highlight Color"
                onClick={() => { setShowHighlightDrop(p => !p); setShowFontColorDrop(false); }}
                className="flex flex-col items-center justify-center w-7 h-7 rounded hover:bg-gray-300 border border-transparent cursor-pointer"
              >
                <Highlighter size={13} className="text-gray-700" />
                <div className="w-4 h-1 rounded-sm mt-0.5" style={{ backgroundColor: highlightColor }} />
              </button>
              <DropdownPanel open={showHighlightDrop} anchorRef={highlightBtnRef} onClose={() => setShowHighlightDrop(false)} width={180}>
                <div className="p-2">
                  <button
                    onClick={() => applyHighlight('transparent')}
                    className="w-full text-left px-2 py-1 text-xs hover:bg-blue-50 rounded flex items-center gap-2 mb-1"
                  >
                    <X size={12} className="text-gray-500" /> No Color
                  </button>
                  <div className="grid grid-cols-6 gap-1">
                    {highlightColors.map(c => (
                      <button
                        key={c}
                        title={c}
                        onClick={() => applyHighlight(c)}
                        className="w-6 h-6 rounded-sm border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </DropdownPanel>
            </div>

            <div ref={fontColorBtnRef}>
              <button
                title="Font Color"
                onClick={() => { setShowFontColorDrop(p => !p); setShowHighlightDrop(false); }}
                className="flex flex-col items-center justify-center w-7 h-7 rounded hover:bg-gray-300 border border-transparent cursor-pointer"
              >
                <span className="font-bold text-gray-800" style={{ fontSize: '13px', lineHeight: 1 }}>A</span>
                <div className="w-4 h-1 rounded-sm mt-0.5" style={{ backgroundColor: fontColor }} />
              </button>
              <DropdownPanel open={showFontColorDrop} anchorRef={fontColorBtnRef} onClose={() => setShowFontColorDrop(false)} width={200}>
                <div className="p-2">
                  <div className="grid grid-cols-8 gap-1 mb-2">
                    {fontColors.map(c => (
                      <button
                        key={c}
                        title={c}
                        onClick={() => applyFontColor(c)}
                        className="w-5 h-5 rounded-sm border border-gray-300 hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <label className="flex items-center gap-2 px-1 py-1 text-xs text-gray-700 hover:bg-gray-50 rounded cursor-pointer border-t border-gray-100 pt-2">
                    <input
                      type="color"
                      value={fontColor}
                      onMouseDown={saveEditorSelection}
                      onChange={(e) => applyFontColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-gray-300"
                    />
                    <span>Custom Color…</span>
                  </label>
                </div>
              </DropdownPanel>
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

            <div ref={spacingBtnRef}>
              <SmallBtn label="Line and Paragraph Spacing" onClick={() => setShowSpacingDrop(p => !p)}>
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <line x1="4" y1="3" x2="13" y2="3" stroke="#555" strokeWidth="1.5" />
                  <line x1="4" y1="7" x2="13" y2="7" stroke="#555" strokeWidth="1.5" />
                  <line x1="4" y1="11" x2="13" y2="11" stroke="#555" strokeWidth="1.5" />
                  <polygon points="1.5,1 3,4 0,4" fill="#555" />
                  <polygon points="1.5,13 3,10 0,10" fill="#555" />
                </svg>
              </SmallBtn>
              <DropdownPanel open={showSpacingDrop} anchorRef={spacingBtnRef} onClose={() => setShowSpacingDrop(false)} width={176}>
                <div className="py-1">
                  {lineSpacingOptions.map(v => (
                    <button
                      key={v}
                      onClick={() => applyLineSpacing(v)}
                      className={`w-full text-left px-3 py-1 text-xs hover:bg-blue-50 ${lineSpacing === v ? 'bg-blue-100' : ''}`}
                    >{v} Line Spacing</button>
                  ))}
                  <div className="border-t border-gray-200 my-1" />
                  <button onClick={() => { setParaSpacing('before', 0); setShowSpacingDrop(false); }} className="w-full text-left px-3 py-1 text-xs hover:bg-blue-50">
                    Remove Space Before Paragraph
                  </button>
                  <button onClick={() => { setParaSpacing('after', 0); setShowSpacingDrop(false); }} className="w-full text-left px-3 py-1 text-xs hover:bg-blue-50">
                    Remove Space After Paragraph
                  </button>
                </div>
              </DropdownPanel>
            </div>

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
                onClick={() => applyStyle(s.name)}
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
            { Icon: MousePointer, label: 'Select',  extra: '▾' }
          ].map(({ Icon, label, extra }) => (
            <button
              key={label}
              title={label}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-gray-100 text-xs text-gray-700 whitespace-nowrap"
            >
              <Icon size={13} className="text-gray-500" />
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
    </div>
  );

  const InsertRibbon = () => (
    <div className="flex items-stretch h-full">
      <RibbonGroup label="Pages">
        <div className="flex flex-col gap-0.5 justify-center">
          <TextRowBtn icon={BookOpen} label="Cover Page" extra="▾" onClick={insertCoverPage} />
          <TextRowBtn icon={FileText} label="Blank Page" onClick={insertBlankPage} />
          <TextRowBtn icon={LayoutGrid} label="Page Break" onClick={insertPageBreak} />
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Tables">
        <div>
          <button
            ref={tableBtnRef}
            onClick={() => setShowTableDrop(p => !p)}
            className="flex flex-col items-center justify-center rounded px-1 py-1 hover:bg-gray-100 border border-transparent gap-0.5 text-center shrink-0"
            style={{ height: '60px', width: '48px' }}
          >
            <LayoutGrid size={22} className="text-gray-700" />
            <span className="text-[11px] text-gray-700 leading-tight flex items-center gap-0.5 justify-center">
              <span>Table</span><ChevronDown size={8} className="shrink-0" />
            </span>
          </button>
          <DropdownPanel open={showTableDrop} anchorRef={tableBtnRef} onClose={() => { setShowTableDrop(false); setTableHover({ r: -1, c: -1 }); }} width={228}>
            <div className="p-2">
              <div
                className="grid grid-cols-10 gap-0.5 w-fit"
                onMouseLeave={() => setTableHover({ r: -1, c: -1 })}
              >
                {Array.from({ length: 80 }).map((_, i) => {
                  const r = Math.floor(i / 10);
                  const c = i % 10;
                  const active = r <= tableHover.r && c <= tableHover.c;
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setTableHover({ r, c })}
                      onClick={() => insertTableGrid(r + 1, c + 1)}
                      className={`w-4 h-4 border cursor-pointer ${active ? 'bg-blue-500 border-blue-700' : 'bg-white border-gray-300'}`}
                    />
                  );
                })}
              </div>
              <div className="text-xs text-gray-600 text-center mt-1.5">
                {tableHover.r >= 0 ? `${tableHover.r + 1} x ${tableHover.c + 1} Table` : 'Insert Table'}
              </div>
            </div>
          </DropdownPanel>
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Illustrations">
        <div className="flex items-center gap-px">
          <LargeBtn icon={Image} label="Pictures" w={46} />
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
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Media">
        <LargeBtn icon={Video} label="Online Videos" hasDropdown={false} w={58} />
      </RibbonGroup>
    </div>
  );

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
        </div>
      </RibbonGroup>
    </div>
  );

  const LayoutRibbon = () => (
    <div className="flex items-stretch h-full">
      <RibbonGroup label="Page Setup">
        <div className="flex items-center gap-0.5">
          <div>
            <button
              ref={marginsBtnRef}
              onClick={() => setShowMarginsDrop(p => !p)}
              className="flex flex-col items-center justify-center rounded px-1 py-1 hover:bg-gray-100 gap-0.5 shrink-0"
              style={{ height: '60px', width: '50px' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <rect x="2" y="1" width="14" height="16" fill="none" stroke="#374151" strokeWidth="1.2" />
                <line x1="5" y1="1" x2="5" y2="17" stroke="#374151" strokeWidth="1" strokeDasharray="1.5,1.5" />
                <line x1="13" y1="1" x2="13" y2="17" stroke="#374151" strokeWidth="1" strokeDasharray="1.5,1.5" />
              </svg>
              <span className="text-[11px] text-gray-700 flex items-center gap-0.5">Margins <ChevronDown size={8} /></span>
            </button>
            <DropdownPanel open={showMarginsDrop} anchorRef={marginsBtnRef} onClose={() => setShowMarginsDrop(false)} width={224}>
              <div className="py-1">
                {marginPresets.map(p => (
                  <button
                    key={p.name}
                    onClick={() => applyMarginPreset(p.values)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 flex items-center justify-between"
                  >
                    <span>{p.name}</span>
                    <span className="text-gray-400">T:{p.values.top}&quot; L:{p.values.left}&quot;</span>
                  </button>
                ))}
                <div className="border-t border-gray-200 mt-1 pt-1.5 px-3 pb-1.5">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <NumberField label="Top" value={pageMargins.top} labelW={32} onIncrement={() => adjustPageMargin('top', 0.1)} onDecrement={() => adjustPageMargin('top', -0.1)} />
                    <NumberField label="Bottom" value={pageMargins.bottom} labelW={40} onIncrement={() => adjustPageMargin('bottom', 0.1)} onDecrement={() => adjustPageMargin('bottom', -0.1)} />
                    <NumberField label="Left" value={pageMargins.left} labelW={32} onIncrement={() => adjustPageMargin('left', 0.1)} onDecrement={() => adjustPageMargin('left', -0.1)} />
                    <NumberField label="Right" value={pageMargins.right} labelW={36} onIncrement={() => adjustPageMargin('right', 0.1)} onDecrement={() => adjustPageMargin('right', -0.1)} />
                  </div>
                </div>
              </div>
            </DropdownPanel>
          </div>
          <LargeBtn icon={Smartphone} label="Orientation" w={56} />
          <LargeBtn icon={FileText} label="Size" w={46} />
          <LargeBtn icon={LayoutGrid} label="Columns" w={52} />
        </div>
      </RibbonGroup>

      <GroupDivider />

      <RibbonGroup label="Paragraph">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <NumberField label="Indent Left" value={indentLeft} labelW={72} onIncrement={() => adjustIndent('left', 0.25)} onDecrement={() => adjustIndent('left', -0.25)} />
            <NumberField label="Indent Right" value={indentRight} labelW={72} onIncrement={() => adjustIndent('right', 0.25)} onDecrement={() => adjustIndent('right', -0.25)} />
          </div>
          <div className="flex flex-col gap-1">
            <NumberField label="Spacing Before" value={spacingBefore} unit=" pt" labelW={84} onIncrement={() => adjustParaSpacing('before', 6)} onDecrement={() => adjustParaSpacing('before', -6)} />
            <NumberField label="Spacing After" value={spacingAfter} unit=" pt" labelW={84} onIncrement={() => adjustParaSpacing('after', 6)} onDecrement={() => adjustParaSpacing('after', -6)} />
          </div>
        </div>
      </RibbonGroup>
    </div>
  );

  const Ruler = () => (
    <div className="flex items-center bg-gray-100 border-b border-gray-300 select-none" style={{ height: '22px' }}>
      <div className="w-[54px] h-full bg-gray-100 border-r border-gray-300 shrink-0 flex items-center justify-center">
        <div className="w-3.5 h-3.5 border border-gray-400 rounded-sm text-gray-500 flex items-center justify-center style={{ fontSize: '8px' }}">◫</div>
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
      </div>
    </div>
  );

  const handleZoom = (delta) => setZoom(z => Math.min(500, Math.max(10, z + delta)));

  const renderRibbon = () => {
    if (activeTab === 'Home')       return HomeRibbon();
    if (activeTab === 'Insert')     return InsertRibbon();
    if (activeTab === 'Design')     return DesignRibbon();
    if (activeTab === 'Layout')     return LayoutRibbon();
    return <div className="p-3 text-xs text-gray-500">Ribbon section for {activeTab}</div>;
  };

  const PAPER_W = 816;
  const PAPER_H = 1056;

  return (
    <div className={`flex flex-col overflow-hidden select-none ${embedded ? 'h-full w-full' : 'h-screen w-screen'}`} style={{ fontFamily: 'Segoe UI, sans-serif' }}>
      <div className="flex items-center justify-between shrink-0 bg-white border-b border-gray-100 px-3 min-w-0" style={{ height: '40px' }}>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-8 h-8 flex items-center justify-center rounded shrink-0">
            <span className="font-black text-2xl leading-none" style={{ color: WORD_BLUE, letterSpacing: '-2px' }}>W</span>
          </div>
          {editingTitle ? (
            <input
              ref={titleRef}
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
              autoFocus
              className="text-sm text-gray-800 border border-blue-400 rounded px-2 py-0.5 outline-none min-w-48"
            />
          ) : (
            <button onClick={() => setEditingTitle(true)} className="text-sm text-gray-700 hover:bg-gray-100 rounded px-2 py-0.5 transition-colors whitespace-nowrap">
              {docTitle} — Word
            </button>
          )}
        </div>
        {embedded && (
          <div className="flex items-center gap-1">
            <button onClick={onClose} className="p-1 hover:bg-red-500 hover:text-white rounded">
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center shrink-0 bg-white border-b border-gray-200 overflow-x-auto" style={{ height: '32px' }}>
        {['Home','Insert','Design','Layout','References','Mailings','Review','View','Help'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 h-full flex items-center text-sm transition-colors border-b-2 whitespace-nowrap
              ${activeTab === tab ? 'border-blue-600 text-blue-700 font-medium' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="shrink-0 border-b border-gray-200 overflow-x-auto bg-white w-full" style={{ minHeight: '88px' }}>
        <div className="flex items-stretch h-full px-1 w-full" style={{ minHeight: '88px' }}>
          {renderRibbon()}
        </div>
      </div>

      <Ruler />

      <div className="flex-1 overflow-auto flex flex-col items-center py-6" style={{ background: '#e0e0e0' }}>
        <div className="flex flex-col items-center" style={{ gap: `${24 * zoom / 100}px` }}>
          {pageIds.map((id, idx) => (
            <div
              key={id}
              style={{
                width: `${PAPER_W * zoom / 100}px`,
                height: `${PAPER_H * zoom / 100}px`,
                position: 'relative',
                flexShrink: 0
              }}
            >
              <div
                style={{
                  width: `${PAPER_W}px`,
                  height: `${PAPER_H}px`,
                  padding: `${pageMargins.top}in ${pageMargins.right}in ${pageMargins.bottom}in ${pageMargins.left}in`,
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                  transformOrigin: 'top left',
                  transform: `scale(${zoom / 100})`,
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  boxSizing: 'border-box',
                  overflow: 'hidden'
                }}
              >
                <div
                  ref={el => registerPageRef(id, el)}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => handleEditorInput(id)}
                  onFocus={() => setActivePage(id)}
                  onKeyUp={syncState}
                  onMouseUp={syncState}
                  className="outline-none w-full font-normal"
                  style={{
                    fontFamily,
                    fontSize: `${parseInt(fontSize)}px`,
                    lineHeight: lineSpacing,
                    color: '#000',
                    minHeight: `${PAPER_H - (pageMargins.top + pageMargins.bottom) * 96}px`
                  }}
                  data-placeholder={idx === 0 ? 'Start typing your document...' : ''}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-3 shrink-0 text-white" style={{ backgroundColor: WORD_BLUE, height: '24px', fontSize: '11px' }}>
        <div>Page {currentPageDisplay} of {pageIds.length} | {wordCount} words</div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleZoom(-10)}><ZoomOut size={11} /></button>
          <span>{zoom}%</span>
          <button onClick={() => handleZoom(10)}><ZoomIn size={11} /></button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   COMMUNITIES PLATFORM SUB-MODULE (COMPONENTS OUTSIDE main view)
   ────────────────────────────────────────────────────────────── */

const communityFilters = ["All", "Resource", "Question", "Link", "Assignment"];

const TYPE_META = {
  resource: { label: "Resource", color: "#2563eb", bg: "#eff6ff" },
  question: { label: "Question", color: "#d97706", bg: "#fffbeb" },
  link: { label: "Link", color: "#059669", bg: "#ecfdf5" },
  assignment: { label: "Assignment", color: "#7c3aed", bg: "#f5f3ff" }
};

const AVATAR_COLORS = ["#1e3a5f", "#1a3a2a", "#3a1a2a", "#1a1a3a", "#3a2a1a"];

const getInitials = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

const avatarColor = (name) =>
  AVATAR_COLORS[(name || "?").charCodeAt(0) % AVATAR_COLORS.length];

const getAuthorName = (author) => {
  if (!author) return "Unknown";
  return author.username || `${author.first_name || ""} ${author.last_name || ""}`.trim() || "Unknown";
};

const isPostOwner = (post, currentUserId) =>
  !!currentUserId && post.author?.user_id === currentUserId;

const isCommentOwner = (comment, currentUserId) =>
  !!currentUserId && comment.author?.user_id === currentUserId;

const formatRelativeTime = (value) => {
  if (!value) return "";
  const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
  const date = new Date(hasZone ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr !== 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

const formatJoinDate = (value) => {
  if (!value) return "";
  const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
  const date = new Date(hasZone ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

const injectStyles = () => {
  if (typeof document === "undefined" || document.getElementById("cm-styles")) return;
  const el = document.createElement("style");
  el.id = "cm-styles";
  el.textContent = `
    .cm-card { background: #fff; border: 1px solid #e8eaed; border-radius: 20px; padding: 28px; transition: box-shadow 0.2s ease, transform 0.2s ease; }
    .cm-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.07); transform: translateY(-1px); }
    .cm-pill { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 500; white-space: nowrap; }
    .cm-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 999px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; border: none; white-space: nowrap; }
    .cm-btn-dark { background: #0f172a; color: #fff; }
    .cm-btn-dark:hover { background: #1e293b; }
    .cm-btn-dark:disabled { opacity: 0.5; cursor: not-allowed; }
    .cm-btn-ghost { background: transparent; color: #475569; border: 1px solid #e2e8f0; }
    .cm-btn-ghost:hover { background: #fff; }
    .cm-reaction { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.15s ease; background: transparent; color: #475569; }
    .cm-reaction:hover { background: #fff; }
    .cm-reaction:disabled { opacity: 0.6; cursor: not-allowed; }
    .cm-reaction-active-like { background: #fff1f2; color: #e11d48; border-color: #fecdd3; }
    .cm-reaction-active-save { background: #0f172a; color: #fff; border-color: #0f172a; }
    .cm-input { width: 100%; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 16px; font-size: 14px; outline: none; transition: border-color 0.15s ease; background: #fff; color: #0f172a; }
    .cm-input:focus { border-color: #94a3b8; }
    .cm-avatar { display: flex; align-items: center; justify-content: center; border-radius: 50%; font-weight: 600; color: #fff; flex-shrink: 0; letter-spacing: 0.5px; }
    .cm-thread-input-wrap { display: flex; align-items: center; gap: 12px; border: 1px solid #e2e8f0; border-radius: 14px; padding: 8px 12px; background: #fff; }
    .cm-thread-input { flex: 1; border: none; background: transparent; font-size: 13px; outline: none; color: #334155; }
    .cm-author-trigger { background: none; border: none; padding: 0; cursor: pointer; font: inherit; text-align: left; }
    .cm-author-trigger:hover .cm-author-name { text-decoration: underline; }
    .cm-dialog-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.45); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .cm-dialog { background: #fff; border-radius: 20px; padding: 32px; width: 100%; max-width: 380px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); }
    .cm-friend-checkbox { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 11px 16px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; border: 1.5px solid #0f172a; background: #0f172a; color: #fff; transition: all 0.15s ease; }
    .cm-friend-checkbox:disabled { cursor: default; }
    .cm-friend-checkbox-sent { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
    .cm-friend-checkbox-tick { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid currentColor; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  `;
  document.head.appendChild(el);
};

const PostHeader = ({ post, currentUserId, onDeletePost, onOpenProfile }) => {
  const typeMeta = TYPE_META[post.post_type] || TYPE_META.resource;
  const authorName = getAuthorName(post.author);
  const isSelf = !!currentUserId && post.author?.user_id === currentUserId;
  const [menuOpen, setMenuOpen] = useState(false);
  const canDelete = isPostOwner(post, currentUserId);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <button
        type="button"
        className="cm-author-trigger"
        onClick={() => onOpenProfile?.(post.author)}
        disabled={!post.author?.user_id || isSelf}
        style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0, cursor: post.author?.user_id && !isSelf ? "pointer" : "default" }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div className="cm-avatar" style={{ width: 44, height: 44, fontSize: 13, background: avatarColor(authorName) }}>
            {getInitials(authorName)}
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div>
            <span className="cm-author-name" style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>{authorName}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{formatRelativeTime(post.created_at)}</span>
            <span className="cm-pill" style={{ background: typeMeta.bg, color: typeMeta.color, padding: "3px 10px", fontSize: 11 }}>
              {typeMeta.label}
            </span>
            {post.community_name && (
              <span className="cm-pill" style={{ background: "#fff", color: "#64748b", border: "1px solid #e2e8f0", padding: "3px 10px", fontSize: 11 }}>
                {post.community_name}
              </span>
            )}
          </div>
        </div>
      </button>

      {canDelete && (
        <div style={{ position: "relative" }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 6, borderRadius: "50%" }}
          >
            <EllipsisHorizontalIcon style={{ width: 20, height: 20 }} />
          </button>
          {menuOpen && (
            <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", minWidth: 140, overflow: "hidden" }}>
              <button
                onClick={() => { setMenuOpen(false); onDeletePost(post.id); }}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontSize: 13, fontWeight: 500 }}
              >
                <TrashIcon style={{ width: 15, height: 15 }} />
                Delete post
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ReactionBar = ({ post, onToggleReaction, onToggleDiscussion, onShare }) => (
  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, paddingTop: 16, borderTop: "1px solid #f1f5f9", marginTop: 20 }}>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      <button onClick={() => onToggleReaction(post.id, "liked")} className={`cm-reaction ${post.liked_by_me ? "cm-reaction-active-like" : ""}`}>
        {post.liked_by_me ? <HeartIconSolid style={{ width: 15, height: 15 }} /> : <HeartIcon style={{ width: 15, height: 15 }} />}
        {post.post_type === "question" ? "Upvote" : "Like"}
        <span style={{ fontSize: 12, fontWeight: 600 }}>{post.like_count}</span>
      </button>
      <button onClick={() => onToggleDiscussion(post.id)} className="cm-reaction">
        <ChatBubbleLeftRightIcon style={{ width: 15, height: 15 }} />
        {post.post_type === "resource" ? "Discuss" : "Comment"}
        <span style={{ fontSize: 12, fontWeight: 600 }}>{post.comment_count}</span>
      </button>
      <button className="cm-reaction" onClick={() => onShare(post.id)}>
        <ShareIcon style={{ width: 15, height: 15 }} />
        Share
        {post.share_count > 0 && <span style={{ fontSize: 12, fontWeight: 600 }}>{post.share_count}</span>}
      </button>
    </div>
    <button onClick={() => onToggleReaction(post.id, "saved")} className={`cm-reaction ${post.saved_by_me ? "cm-reaction-active-save" : ""}`}>
      {post.saved_by_me ? <BookmarkIconSolid style={{ width: 15, height: 15 }} /> : <BookmarkIcon style={{ width: 15, height: 15 }} />}
      Save
      <span style={{ fontSize: 12, fontWeight: 600 }}>{post.save_count}</span>
    </button>
  </div>
);

const CommentItem = ({ comment, currentUserId, onDeleteComment }) => (
  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <div className="cm-avatar" style={{ width: 34, height: 34, fontSize: 11, background: avatarColor(getAuthorName(comment.author)) }}>
        {getInitials(getAuthorName(comment.author))}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{getAuthorName(comment.author)}</span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{formatRelativeTime(comment.created_at)}</span>
          </div>
          {isCommentOwner(comment, currentUserId) && (
            <button onClick={() => onDeleteComment(comment.id)} title="Delete comment" style={{ background: "none", border: "none", cursor: "pointer", color: "#cbd5e1", padding: 4, flexShrink: 0, display: "flex", alignItems: "center" }}>
              <TrashIcon style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#475569", lineHeight: 1.6 }}>{comment.text}</p>
      </div>
    </div>
    {comment.replies?.length > 0 && (
      <div style={{ marginTop: 10, paddingLeft: 16, borderLeft: "2px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 8 }}>
        {comment.replies.map((reply) => (
          <div key={reply.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{getAuthorName(reply.author)}</span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>{formatRelativeTime(reply.created_at)}</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>{reply.text}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

const DiscussionSection = ({ post, isExpanded, postComments, isLoadingComments, replyDraft, isSendingReply, currentUserId, onToggleDiscussion, onReplyChange, onSendReply, onDeleteComment }) => (
  <div style={{ marginTop: 16 }}>
    <button onClick={() => onToggleDiscussion(post.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "10px 16px", cursor: "pointer" }}>
      <div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Discussion</span>
        <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 8 }}>{post.comment_count} thread{post.comment_count !== 1 ? "s" : ""}</span>
      </div>
      {isExpanded ? <ChevronUpIcon style={{ width: 16, height: 16, color: "#94a3b8" }} /> : <ChevronDownIcon style={{ width: 16, height: 16, color: "#94a3b8" }} />}
    </button>
    <AnimatePresence>
      {isExpanded && (
        <MotionDiv initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: "easeOut" }} style={{ overflow: "hidden" }}>
          <div style={{ paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {isLoadingComments ? (
              <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>Loading comments...</p>
            ) : postComments.length === 0 ? (
              <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "12px 0" }}>No comments yet. Be the first to reply.</p>
            ) : (
              postComments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} currentUserId={currentUserId} onDeleteComment={(commentId) => onDeleteComment(post.id, commentId)} />
              ))
            )}
            <div className="cm-thread-input-wrap">
              <div className="cm-avatar" style={{ width: 30, height: 30, fontSize: 10, background: "#1e293b" }}>You</div>
              <input className="cm-thread-input" placeholder="Add a reply…" value={replyDraft} onChange={(e) => onReplyChange(post.id, e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onSendReply(post.id, replyDraft); }} />
              <button className="cm-btn cm-btn-dark" style={{ padding: "6px 14px" }} onClick={() => onSendReply(post.id, replyDraft)} disabled={isSendingReply || !replyDraft.trim()}>
                <PaperAirplaneIcon style={{ width: 14, height: 14 }} />
                {isSendingReply ? "Sending..." : "Reply"}
              </button>
            </div>
          </div>
        </MotionDiv>
      )}
    </AnimatePresence>
  </div>
);

const ResourceBlock = ({ post, onToggleReaction }) => {
  const resource = post.resource;
  const fileLabel = resource?.resource_type?.toUpperCase() || "FILE";
  return (
    <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "140px 1fr", gap: 14 }}>
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <DocumentTextIcon style={{ width: 36, height: 36, color: "rgba(255,255,255,0.9)" }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em" }}>{fileLabel}</span>
      </div>
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          {resource?.total_pages && <span style={{ background: "#f1f5f9", color: "#475569", fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 999 }}>{resource.total_pages} pages</span>}
        </div>
        <p style={{ margin: "0 0 12px", fontSize: 14, color: "#334155", lineHeight: 1.6 }}>{post.text}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="cm-btn cm-btn-dark" onClick={() => resource?.url && window.open(resource.url, "_blank")}>
            <ArrowDownTrayIcon style={{ width: 14, height: 14 }} /> View Resource
          </button>
          <button className="cm-btn cm-btn-ghost" onClick={() => onToggleReaction(post.id, "saved")}>
            <BookmarkIcon style={{ width: 14, height: 14 }} /> Save
          </button>
        </div>
      </div>
    </div>
  );
};

const QuestionBlock = ({ post, postComments, onToggleDiscussion, onToggleReaction }) => {
  const previewAnswers = postComments.slice(0, 2);
  return (
    <div style={{ marginTop: 16, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#d97706", letterSpacing: "0.08em", textTransform: "uppercase" }}>Question</span>
      <p style={{ margin: "8px 0 12px", fontSize: 14, color: "#334155", lineHeight: 1.6 }}>{post.text}</p>
      {previewAnswers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.06em" }}>Top answers</p>
          {previewAnswers.map((answer) => (
            <div key={answer.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{getAuthorName(answer.author)} </span>
              <span style={{ fontSize: 13, color: "#475569" }}>{answer.text}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="cm-btn cm-btn-dark" onClick={() => onToggleDiscussion(post.id)}>
          <ChatBubbleLeftRightIcon style={{ width: 14, height: 14 }} /> Answer
        </button>
        <button className="cm-btn cm-btn-ghost" onClick={() => onToggleReaction(post.id, "liked")}>
          <HeartIcon style={{ width: 14, height: 14 }} /> Upvote
        </button>
      </div>
    </div>
  );
};

const LinkBlock = ({ post, onToggleReaction }) => {
  const data = post.type_data || {};
  return (
    <div style={{ marginTop: 16, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#166534", display: "flex", alignItems: "center", justifyCenter: "center", flexShrink: 0 }}>
          <LinkIcon style={{ width: 20, height: 20, color: "#fff" }} />
        </div>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{data.link_title}</p>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: "#059669" }}>{data.link_url}</p>
          <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{data.link_snippet}</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button className="cm-btn cm-btn-dark" onClick={() => { const url = data.link_url?.startsWith("http") ? data.link_url : `https://${data.link_url}`; window.open(url, "_blank"); }}>Open Link</button>
        <button className="cm-btn cm-btn-ghost" onClick={() => onToggleReaction(post.id, "saved")}>Save</button>
      </div>
    </div>
  );
};

const AssignmentBlock = ({ post, onToggleDiscussion }) => (
  <div style={{ marginTop: 16, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16 }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: "#6d28d9", display: "flex", alignItems: "center", justifyCenter: "center", flexShrink: 0 }}>
        <DocumentTextIcon style={{ width: 20, height: 20, color: "#fff" }} />
      </div>
      <div>
        <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{post.title}</p>
        <p style={{ margin: 0, fontSize: 13, color: "#4c1d95", lineHeight: 1.6 }}>{post.text}</p>
      </div>
    </div>
    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
      <button className="cm-btn cm-btn-dark" onClick={() => onToggleDiscussion(post.id)}>Comment</button>
    </div>
  </div>
);

const PostCard = ({ post, isExpanded, postComments, isLoadingComments, replyDraft, isSendingReply, currentUserId, onToggleReaction, onToggleDiscussion, onShare, onReplyChange, onSendReply, onDeletePost, onDeleteComment, onOpenProfile }) => (
  <MotionArticle className="cm-card" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.4, ease: "easeOut" }}>
    <PostHeader post={post} currentUserId={currentUserId} onDeletePost={onDeletePost} onOpenProfile={onOpenProfile} />
    <div style={{ marginTop: 16 }}>
      <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a", lineHeight: 1.4 }}>{post.title}</p>
    </div>
    {post.post_type === "resource" && <ResourceBlock post={post} onToggleReaction={onToggleReaction} />}
    {post.post_type === "question" && <QuestionBlock post={post} postComments={postComments} onToggleDiscussion={onToggleDiscussion} onToggleReaction={onToggleReaction} />}
    {post.post_type === "link" && <LinkBlock post={post} onToggleReaction={onToggleReaction} />}
    {post.post_type === "assignment" && <AssignmentBlock post={post} onToggleDiscussion={onToggleDiscussion} />}
    <ReactionBar post={post} onToggleReaction={onToggleReaction} onToggleDiscussion={onToggleDiscussion} onShare={onShare} />
    <DiscussionSection post={post} isExpanded={isExpanded} postComments={postComments} isLoadingComments={isLoadingComments} replyDraft={replyDraft} isSendingReply={isSendingReply} currentUserId={currentUserId} onToggleDiscussion={onToggleDiscussion} onReplyChange={onReplyChange} onSendReply={onSendReply} onDeleteComment={onDeleteComment} />
  </MotionArticle>
);

const Sidebar = ({ recentUploads, topContributors }) => (
  <aside style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 96 }}>
    <div style={{ background: "#fff", border: "1px solid #e8eaed", borderRadius: 20, padding: 24, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyBetween: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Recent Uploads</span>
        <DocumentTextIcon style={{ width: 16, height: 16, color: "#cbd5e1" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {recentUploads.length === 0 ? (
          <p style={{ fontSize: 12, color: "#94a3b8" }}>No uploads yet.</p>
        ) : (
          recentUploads.map((item) => (
            <div key={item.post_id} style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
              <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{item.title}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{item.meta}</p>
            </div>
          ))
        )}
      </div>
    </div>

    <div style={{ background: "#fff", border: "1px solid #e8eaed", borderRadius: 20, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyBetween: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Top Contributors</span>
        <UsersIcon style={{ width: 16, height: 16, color: "#cbd5e1" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {topContributors.length === 0 ? (
          <p style={{ fontSize: 12, color: "#94a3b8" }}>Not enough activity yet.</p>
        ) : (
          topContributors.map((c) => (
            <div key={c.user_id} style={{ display: "flex", alignItems: "center", justifyBetween: "center", padding: "10px 14px", borderRadius: 12, background: c.rank === 1 ? "#0f172a" : "#fff", border: c.rank === 1 ? "none" : "1px solid #e2e8f0" }}>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: c.rank === 1 ? "#fff" : "#1e293b" }}>{c.username}</p>
                <p style={{ margin: 0, fontSize: 11, color: c.rank === 1 ? "rgba(255,255,255,0.55)" : "#94a3b8" }}>{c.contributions} contribution{c.contributions !== 1 ? "s" : ""}</p>
              </div>
              <div className="cm-avatar" style={{ width: 34, height: 34, fontSize: 12, background: c.rank === 1 ? "rgba(255,255,255,0.15)" : avatarColor(c.username) }}>
                {getInitials(c.username)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  </aside>
);

const UserProfileDialog = ({ isOpen, profile, isLoadingProfile, friendStatus, isSendingRequest, errorMessage, onClose, onSendRequest }) => {
  if (!isOpen) return null;
  const name = getAuthorName(profile);
  let buttonLabel = "Add Friend";
  let buttonDisabled = isSendingRequest;
  let buttonClass = "cm-friend-checkbox";
  let showTick = false;

  if (friendStatus === "friends") {
    buttonLabel = "Already Friends";
    buttonDisabled = true;
    buttonClass += " cm-friend-checkbox-sent";
    showTick = true;
  } else if (friendStatus === "pending") {
    buttonLabel = "Request Sent";
    buttonDisabled = true;
    buttonClass += " cm-friend-checkbox-sent";
    showTick = true;
  } else if (isSendingRequest) {
    buttonLabel = "Sending...";
  }

  return (
    <div className="cm-dialog-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cm-dialog">
        <div style={{ display: "flex", justifyEnd: "center" }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
            <XMarkIcon style={{ width: 20, height: 20 }} />
          </button>
        </div>
        {isLoadingProfile ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>Loading profile...</div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: -8 }}>
              <div className="cm-avatar" style={{ width: 72, height: 72, fontSize: 22, background: avatarColor(name) }}>{getInitials(name)}</div>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>{name}</p>
                {profile?.username && <p style={{ margin: "2px 0 0", fontSize: 13, color: "#94a3b8" }}>@{profile.username}</p>}
              </div>
              {profile?.created_at && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: "#64748b", fontSize: 12 }}>
                  <CalendarDaysIcon style={{ width: 14, height: 14 }} /> Joined {formatJoinDate(profile.created_at)}
                </div>
              )}
            </div>
            {errorMessage && <div style={{ marginTop: 16, padding: 10, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, color: "#b91c1c", fontSize: 12, textAlign: "center" }}>{errorMessage}</div>}
            {friendStatus !== "self" && (
              <button type="button" className={buttonClass} disabled={buttonDisabled} onClick={onSendRequest} style={{ marginTop: 22 }}>
                <span className="cm-friend-checkbox-tick">{showTick && <CheckIcon style={{ width: 13, height: 13 }} />}</span>
                {!showTick && !isSendingRequest && <UserPlusIcon style={{ width: 15, height: 15 }} />}
                {buttonLabel}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default function Communities() {
  injectStyles();
  const { getToken } = useAuth();
  const { user } = useUser();
  const currentUserId = user?.id;

  const [addPostModalOpen, setAddPostModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedPosts, setExpandedPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [commentsLoading, setCommentsLoading] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replySending, setReplySending] = useState({});

  const [recentUploads, setRecentUploads] = useState([]);
  const [topContributors, setTopContributors] = useState([]);

  const reactionInFlight = useRef({});

  const [friendIds, setFriendIds] = useState(new Set());
  const [sentRequestIds, setSentRequestIds] = useState(new Set());
  const [profileDialog, setProfileDialog] = useState({
    open: false,
    author: null,
    profile: null,
    loading: false,
    sending: false,
    error: ""
  });

  const loadComments = useCallback(async (postId) => {
    setCommentsLoading((cur) => ({ ...cur, [postId]: true }));
    try {
      const token = await getToken();
      const data = await communityService.getComments(token, postId);
      setComments((cur) => ({ ...cur, [postId]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      setComments((cur) => ({ ...cur, [postId]: [] }));
    } finally {
      setCommentsLoading((cur) => ({ ...cur, [postId]: false }));
    }
  }, [getToken]);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = await getToken();

      const params = { skip: 0, limit: 50 };
      if (activeFilter !== "All") params.postType = activeFilter.toLowerCase();
      if (query.trim()) params.search = query.trim();

      const data = await communityService.getPosts(token, params);
      const fetchedPosts = Array.isArray(data?.posts) ? data.posts : [];
      setPosts(fetchedPosts);

      const questionPosts = fetchedPosts.filter((p) => p.post_type === "question");
      questionPosts.forEach((p) => {
        setComments((cur) => {
          if (cur[p.id] === undefined) loadComments(p.id);
          return cur;
        });
      });
    } catch (err) {
      setError(err.message || "Failed to load posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, query, getToken, loadComments]);

  useEffect(() => {
    const timer = setTimeout(fetchPosts, 300);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  useEffect(() => {
    const loadSidebar = async () => {
      try {
        const token = await getToken();
        const [uploads, contributors] = await Promise.all([
          communityService.getRecentUploads(token, 5),
          communityService.getTopContributors(token, 3)
        ]);
        setRecentUploads(Array.isArray(uploads) ? uploads : []);
        setTopContributors(Array.isArray(contributors) ? contributors : []);
      } catch (err) {
        console.error(err);
      }
    };
    loadSidebar();
  }, [getToken]);

  useEffect(() => {
    const loadFriendData = async () => {
      try {
        const token = await getToken();
        const [friends, sent] = await Promise.all([
          friendsService.getMyFriends(token),
          friendsService.getSentRequests(token)
        ]);
        setFriendIds(new Set((Array.isArray(friends) ? friends : []).map((f) => f.user_id)));
        setSentRequestIds(
          new Set(
            (Array.isArray(sent) ? sent : [])
              .filter((r) => r.status === "pending")
              .map((r) => r.receiver_id)
          )
        );
      } catch (err) {
        console.error(err);
      }
    };
    loadFriendData();
  }, [getToken]);

  const handleOpenProfile = useCallback(async (author) => {
    if (!author?.user_id) return;
    setProfileDialog({ open: true, author, profile: author, loading: true, sending: false, error: "" });
    try {
      const token = await getToken();
      const fullProfile = await friendsService.getUserProfile(token, author.user_id);
      setProfileDialog((cur) => cur.author?.user_id === author.user_id ? { ...cur, profile: fullProfile, loading: false } : cur);
    } catch (err) {
      setProfileDialog((cur) => cur.author?.user_id === author.user_id ? { ...cur, loading: false } : cur);
    }
  }, [getToken]);

  const handleCloseProfileDialog = useCallback(() => {
    setProfileDialog((cur) => ({ ...cur, open: false }));
  }, []);

  const handleSendFriendRequest = useCallback(async () => {
    const receiverId = profileDialog.author?.user_id;
    if (!receiverId || profileDialog.sending) return;
    setProfileDialog((cur) => ({ ...cur, sending: true, error: "" }));
    try {
      const token = await getToken();
      await friendsService.sendFriendRequest(token, receiverId);
      setSentRequestIds((cur) => new Set(cur).add(receiverId));
      setProfileDialog((cur) => ({ ...cur, sending: false }));
    } catch (err) {
      const message = err.message || "Failed to send friend request";
      if (/already exists/i.test(message)) {
        setSentRequestIds((cur) => new Set(cur).add(receiverId));
        setProfileDialog((cur) => ({ ...cur, sending: false }));
      } else if (/already friends/i.test(message)) {
        setFriendIds((cur) => new Set(cur).add(receiverId));
        setProfileDialog((cur) => ({ ...cur, sending: false }));
      } else {
        setProfileDialog((cur) => ({ ...cur, sending: false, error: message }));
      }
    }
  }, [getToken, profileDialog.author, profileDialog.sending]);

  const profileFriendStatus = (() => {
    const authorId = profileDialog.author?.user_id;
    if (!authorId) return "none";
    if (authorId === currentUserId) return "self";
    if (friendIds.has(authorId)) return "friends";
    if (sentRequestIds.has(authorId)) return "pending";
    return "none";
  })();

  const toggleReaction = useCallback(async (postId, field) => {
    const flightKey = `${postId}-${field}`;
    if (reactionInFlight.current[flightKey]) return;
    reactionInFlight.current[flightKey] = true;
    try {
      const token = await getToken();
      const action = field === "liked" ? communityService.toggleLike : communityService.toggleSave;
      const result = await action(token, postId);
      setPosts((cur) => cur.map((p) => {
        if (p.id !== postId) return p;
        if (field === "liked") return { ...p, liked_by_me: result.active, like_count: result.like_count ?? p.like_count };
        return { ...p, saved_by_me: result.active, save_count: result.save_count ?? p.save_count };
      }));
    } catch (err) {
      console.error(err);
    } finally {
      reactionInFlight.current[flightKey] = false;
    }
  }, [getToken]);

  const handleShare = useCallback(async (postId) => {
    try {
      const token = await getToken();
      const result = await communityService.sharePost(token, postId);
      setPosts((cur) => cur.map((p) => (p.id === postId ? { ...p, share_count: result.share_count } : p)));
      if (result.share_url) {
        navigator.clipboard.writeText(window.location.origin + result.share_url).catch(() => {});
      }
    } catch (err) {
      console.error(err);
    }
  }, [getToken]);

  const toggleDiscussion = useCallback((postId) => {
    setExpandedPosts((cur) => cur.includes(postId) ? cur.filter((x) => x !== postId) : [...cur, postId]);
    setComments((cur) => {
      if (cur[postId] === undefined) loadComments(postId);
      return cur;
    });
  }, [loadComments]);

  const handleReplyChange = useCallback((postId, value) => {
    setReplyDrafts((cur) => ({ ...cur, [postId]: value }));
  }, []);

  const handleSendReply = useCallback(async (postId, rawText) => {
    const text = (rawText || "").trim();
    if (!text || replySending[postId]) return;
    setReplySending((s) => ({ ...s, [postId]: true }));
    try {
      const token = await getToken();
      await communityService.addComment(token, postId, { text });
      setReplyDrafts((d) => ({ ...d, [postId]: "" }));
      await loadComments(postId);
      setPosts((p) => p.map((post) => (post.id === postId ? { ...post, comment_count: post.comment_count + 1 } : post)));
    } catch (err) {
      console.error(err);
    } finally {
      setReplySending((s) => ({ ...s, [postId]: false }));
    }
  }, [getToken, loadComments, replySending]);

  const handleDeletePost = useCallback(async (postId) => {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    const previousPosts = posts;
    setPosts((cur) => cur.filter((p) => p.id !== postId));
    try {
      const token = await getToken();
      await communityService.deletePost(token, postId);
    } catch (err) {
      setPosts(previousPosts);
    }
  }, [getToken, posts]);

  const handleDeleteComment = useCallback(async (postId, commentId) => {
    if (!window.confirm("Delete this comment? This can't be undone.")) return;
    const previousComments = comments[postId] || [];
    setComments((cur) => ({ ...cur, [postId]: previousComments.filter((c) => c.id !== commentId) }));
    setPosts((cur) => cur.map((p) => (p.id === postId ? { ...p, comment_count: Math.max(0, p.comment_count - 1) } : p)));
    try {
      const token = await getToken();
      await communityService.deleteComment(token, postId, commentId);
    } catch (err) {
      setComments((cur) => ({ ...cur, [postId]: previousComments }));
      setPosts((cur) => cur.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)));
    }
  }, [getToken, comments]);

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "112px 24px 80px" }}>
        <div style={{ marginBottom: 32 }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em" }}>Communities</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 20, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 999, padding: "10px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flex: 1 }}>
            <MagnifyingGlassIcon style={{ width: 18, height: 18, color: "#94a3b8", flexShrink: 0 }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search notes, questions, PDFs…" style={{ border: "none", background: "transparent", flex: 1, fontSize: 14, color: "#334155", outline: "none" }} />
          </div>
          <button className="cm-btn cm-btn-dark" style={{ padding: "10px 20px" }} onClick={() => setAddPostModalOpen(true)}>
            <PlusIcon style={{ width: 15, height: 15 }} /> Create Post
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
          {communityFilters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: "7px 18px", borderRadius: 999, fontSize: 13, fontWeight: 500,
                cursor: "pointer", border: "1px solid", transition: "all 0.15s ease",
                background: activeFilter === f ? "#0f172a" : "#fff",
                color: activeFilter === f ? "#fff" : "#475569",
                borderColor: activeFilter === f ? "#0f172a" : "#e2e8f0"
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {error && <div style={{ marginBottom: 20, padding: 14, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, color: "#b91c1c", fontSize: 13 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 0, alignItems: "start" }}>
          <div style={{ paddingRight: 32, borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 20 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>Loading posts...</div>
            ) : posts.length === 0 ? (
              <div style={{ background: "#fff", border: "1px dashed #e2e8f0", borderRadius: 20, padding: 48, textAlign: "center" }}>
                <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>No posts match your current filter.</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard
                  key={post.id} post={post} isExpanded={expandedPosts.includes(post.id)}
                  postComments={comments[post.id] || []} isLoadingComments={!!commentsLoading[post.id]}
                  replyDraft={replyDrafts[post.id] || ""} isSendingReply={!!replySending[post.id]}
                  currentUserId={currentUserId} onToggleReaction={toggleReaction} onToggleDiscussion={toggleDiscussion}
                  onShare={handleShare} onReplyChange={handleReplyChange} onSendReply={handleSendReply}
                  onDeletePost={handleDeletePost} onDeleteComment={handleDeleteComment} onOpenProfile={handleOpenProfile}
                />
              ))
            )}
          </div>

          <div style={{ paddingLeft: 32 }}>
            <Sidebar recentUploads={recentUploads} topContributors={topContributors} />
          </div>
        </div>

        <AddPostModal isOpen={addPostModalOpen} onClose={() => setAddPostModalOpen(false)} onCreated={(newPost) => setPosts((cur) => [newPost, ...cur])} />

        <UserProfileDialog
          isOpen={profileDialog.open} profile={profileDialog.profile} isLoadingProfile={profileDialog.loading}
          friendStatus={profileFriendStatus} isSendingRequest={profileDialog.sending} errorMessage={profileDialog.error}
          onClose={handleCloseProfileDialog} onSendRequest={handleSendFriendRequest}
        />
      </main>
    </div>
  );
}