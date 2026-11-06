import React, { useState, useRef, useEffect } from "react";
import {
  Image as ImageIcon, Type, ListChecks, FileText, Video, Plus, Trash2,
  Save, Upload, MapPin, Mail, HelpCircle, PartyPopper, Volume2, SlidersHorizontal,
  Smartphone, Rocket, Palette, GlassWater, Check, Music, CheckCircle2, XCircle,
  Trophy, LayoutGrid, Link as LinkIcon, Share2,
} from "lucide-react";

const TABS = [
  { id: "player", label: "Player Form", icon: SlidersHorizontal },
  { id: "thanks", label: "Thank You Page", icon: PartyPopper },
  { id: "email", label: "Email", icon: Mail },
  { id: "audio", label: "Audio", icon: Volume2 },
  { id: "settings", label: "Settings", icon: HelpCircle },
  { id: "locations", label: "Locations", icon: MapPin },
];

const FIELD_TYPES = ["Text", "Email", "Phone", "Number", "Date"];

const BACKGROUND_PRESETS = [
  { id: "twilight", name: "Twilight", css: "linear-gradient(180deg,#2B0F52 0%,#5C2680 100%)" },
];

const DEFAULT_BOTTLES = [
  { id: uidSafe("b1"), name: "Citrus Fizz", liquidA: "#FFC93D", liquidB: "#FF8A3D" },
  { id: uidSafe("b2"), name: "Blue Lagoon", liquidA: "#7EE7F0", liquidB: "#2FB6D9" },
  { id: uidSafe("b3"), name: "Berry Pink", liquidA: "#FF8FD0", liquidB: "#E64BA3" },
  { id: uidSafe("b4"), name: "Limeade", liquidA: "#B6FF6B", liquidB: "#5FC93D" },
  { id: uidSafe("b5"), name: "Grape Soda", liquidA: "#C8A2FF", liquidB: "#8A4BE6" },
];

const BOTTLE_DESIGNS = [
  {
    id: "soda",
    name: "Soda Bottle",
    viewBox: "0 0 34 60",
    d: "M12 2h10v5a3 3 0 0 1 2 2.8v3.4c2.2 2.6 4 5.6 4 9.3v29a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V22.5c0-3.7 1.8-6.7 4-9.3V9.8A3 3 0 0 1 12 7V2z",
  },
  {
    id: "juice",
    name: "Juice Bottle",
    viewBox: "0 0 34 60",
    d: "M11 2h12v4.5c1.7.6 3 2 3 4V17c2.4 2.7 4 6.4 4 10.5V47a9 9 0 0 1-9 9H13a9 9 0 0 1-9-9V27.5C4 23.4 5.6 19.7 8 17v-6.5c0-2 1.3-3.4 3-4V2z",
  },
  {
    id: "sports",
    name: "Sports Bottle",
    viewBox: "0 0 34 60",
    d: "M14 2h6v3h2a2 2 0 0 1 2 2v3.5c1.6.9 2.5 2.3 2.5 4V51a6 6 0 0 1-6 6H15.5a6 6 0 0 1-6-6V14.5c0-1.7.9-3.1 2.5-4V7a2 2 0 0 1 2-2h2V2h-2z",
  },
  {
    id: "mason",
    name: "Mason Jar",
    viewBox: "0 0 34 60",
    d: "M11 4h12v3.5H11V4zM9 7.5h16a2 2 0 0 1 2 2V13a2 2 0 0 1-1 1.7c1.3 1 2 2.6 2 4.6v29.2a9 9 0 0 1-9 9H15a9 9 0 0 1-9-9V19.3c0-2 .7-3.6 2-4.6A2 2 0 0 1 7 13V9.5a2 2 0 0 1 2-2z",
  },
  {
    id: "smoothie",
    name: "Smoothie Cup",
    viewBox: "0 0 34 60",
    d: "M15 0H18V20H15Z M6 19Q16.5 2 27 19Z M7 21H26L23 54A5 5 0 0 1 18 59H15A5 5 0 0 1 10 54Z",
  },
  {
    id: "wine",
    name: "Wine Bottle",
    viewBox: "0 0 34 60",
    d: "M15 0H19V9C21 11 22 13 22 16V52A8 8 0 0 1 14 60A8 8 0 0 1 6 52V16C6 13 7 11 9 9V0H15Z M14 0H19V4H14Z",
  },
  {
    id: "gin",
    name: "Gin Bottle",
    viewBox: "0 0 34 60",
    d: "M14 0H20V6H22V10C24 12 25 14 25 17V52A5 5 0 0 1 20 57H14A5 5 0 0 1 9 52V17C9 14 10 12 12 10V6H14Z",
  },
  {
    id: "whiskey",
    name: "Whiskey Bottle",
    viewBox: "0 0 34 60",
    d: "M13 0H20V10H13Z M7 10H26V51A5 5 0 0 1 21 56H12A5 5 0 0 1 7 51Z",
  },
  {
    id: "rum",
    name: "Rum Bottle",
    viewBox: "0 0 34 60",
    d: "M14 0H19V6C22 8 24 11 24 15V50A9 9 0 0 1 15 59A9 9 0 0 1 6 50V15C6 11 8 8 11 6V0H14Z",
  },
  {
    id: "vodka",
    name: "Vodka Bottle",
    viewBox: "0 0 34 60",
    d: "M14 0H19V8H14Z M12 8H21A2 2 0 0 1 23 10V54A5 5 0 0 1 18 59H15A5 5 0 0 1 10 54V10A2 2 0 0 1 12 8Z",
  },
  {
    id: "tequila",
    name: "Tequila Bottle",
    viewBox: "0 0 34 60",
    d: "M13 0H21V6A3 3 0 0 1 24 9V13C26 15 27 17 27 20V51A9 9 0 0 1 18 60H16A9 9 0 0 1 7 51V20C7 17 8 15 10 13V9A3 3 0 0 1 13 6Z",
  },
  {
    id: "champagne",
    name: "Champagne Bottle",
    viewBox: "0 0 34 60",
    d: "M15 0H18V14C20 17 21 20 21 24V51A9 9 0 0 1 12 60A9 9 0 0 1 3 51V24C3 20 4 17 6 14V0H9Z",
  },
];

const FONT_CATEGORIES = [
  {
    name: "Handwriting",
    emoji: "✍️",
    stack: "cursive",
    fonts: [
      "Dancing Script", "Pacifico", "Caveat", "Shadows Into Light", "Satisfy", "Kalam",
      "Patrick Hand", "Permanent Marker", "Indie Flower", "Gloria Hallelujah", "Bad Script", "Kaushan Script",
    ],
  },
  {
    name: "Professional",
    emoji: "💼",
    stack: "'Helvetica Neue', Arial, sans-serif",
    fonts: [
      "DM Sans", "Inter", "Poppins", "Raleway", "Nunito", "Lato",
      "Montserrat", "Source Sans 3", "Work Sans", "Rubik", "Roboto", "Open Sans",
    ],
  },
  {
    name: "Luxury",
    emoji: "👑",
    stack: "Georgia, 'Times New Roman', serif",
    fonts: [
      "Playfair Display", "Cormorant Garamond", "Cinzel", "Bodoni Moda", "Prata", "Tenor Sans",
      "Libre Baskerville", "Old Standard TT", "Abril Fatface", "Forum", "Cousine Bookletter 1911", "Marcellus",
    ],
  },
  {
    name: "Playful",
    emoji: "🎨",
    stack: "'Comic Sans MS', cursive, sans-serif",
    fonts: [
      "Quicksand", "Josefin Sans", "Exo 2", "Cabin", "Ubuntu", "Comfortaa",
      "Bubblegum Sans", "Fredoka One", "Baloo 2", "Righteous", "Fugaz One", "Lilita One",
    ],
  },
];

function uidSafe(seed) {
  return seed + "-" + Math.random().toString(36).slice(2, 7);
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function ColorSwatch({ value, onChange }) {
  const [text, setText] = useState(value);

  React.useEffect(() => {
    setText(value);
  }, [value]);

  function commitHex(raw) {
    let v = raw.trim();
    if (!v.startsWith("#")) v = "#" + v;
    if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(v)) {
      if (v.length === 4) {
        v = "#" + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
      }
      onChange(v.toUpperCase());
    } else {
      setText(value);
    }
  }

  return (
    <div className="gb-swatch">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="gb-swatch-input"
        aria-label="Pick color"
      />
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commitHex(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commitHex(e.target.value);
            e.target.blur();
          }
        }}
        className="gb-swatch-hex-input"
        spellCheck={false}
        maxLength={7}
        placeholder="#000000"
        aria-label="Hex color code"
      />
    </div>
  );
}

function ImageUploader({ label, value, onChange }) {
  const inputRef = useRef(null);
  return (
    <div className="gb-uploader">
      <div className="gb-uploader-label">{label}</div>
      <div
        className="gb-uploader-box"
        onClick={() => inputRef.current && inputRef.current.click()}
        role="button"
        tabIndex={0}
      >
        {value ? (
          <img src={value} alt={label} className="gb-uploader-preview" />
        ) : (
          <>
            <ImageIcon size={15} strokeWidth={1.8} />
            <span>Upload</span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files && e.target.files[0];
          if (file) onChange(URL.createObjectURL(file));
        }}
      />
    </div>
  );
}

export default function GameBuilder() {
  const [activeTab, setActiveTab] = useState("player");

  const [bgImage, setBgImage] = useState(null);
  const [logoImage, setLogoImage] = useState(null);
  const [bgPresetId, setBgPresetId] = useState("twilight");
  const [customBgTop, setCustomBgTop] = useState("#2B0F52");
  const [customBgBottom, setCustomBgBottom] = useState("#5C2680");

  const [bottles, setBottles] = useState(DEFAULT_BOTTLES);
  const [activeBottleId, setActiveBottleId] = useState(DEFAULT_BOTTLES[0].id);
  const [editingBottleId, setEditingBottleId] = useState(null);
  const [activeDesignId, setActiveDesignId] = useState(BOTTLE_DESIGNS[0].id);

  function updateBottle(id, patch) {
    setBottles((bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }
  function addBottle() {
    const newBottle = { id: uidSafe("b"), name: "New Bottle", liquidA: "#FFC93D", liquidB: "#FF8A3D" };
    setBottles((bs) => [...bs, newBottle]);
    setEditingBottleId(newBottle.id);
  }
  function removeBottle(id) {
    setBottles((bs) => {
      const next = bs.filter((b) => b.id !== id);
      if (activeBottleId === id && next.length) setActiveBottleId(next[0].id);
      return next;
    });
    if (editingBottleId === id) setEditingBottleId(null);
  }

  const [title, setTitle] = useState("Tilt & Pour");
  const [titleColor, setTitleColor] = useState("#1a1a2e");
  const [subtitle, setSubtitle] = useState("Tilt to pour, fill the line, don't spill.");
  const [subtitleColor, setSubtitleColor] = useState("#1a1a2e");
  const [introText, setIntroText] = useState(
    "Tilt your phone forward to tip the bottle and pour. Bring it back upright to stop. Fill each cup to the perfect line before you play."
  );
  const [introColor, setIntroColor] = useState("#444444");

  const [fields, setFields] = useState([
    { id: uid(), label: "Full Name", type: "Text", required: true },
    { id: uid(), label: "Email Address", type: "Email", required: true },
    { id: uid(), label: "Phone Number", type: "Phone", required: false },
  ]);

  function updateField(id, patch) {
    setFields((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }
  function removeField(id) {
    setFields((fs) => fs.filter((f) => f.id !== id));
  }
  function addField() {
    setFields((fs) => [...fs, { id: uid(), label: "", type: "Text", required: false }]);
  }

  const [requireTerms, setRequireTerms] = useState(false);
  const [termsLabel, setTermsLabel] = useState("Terms & Conditions");
  const [termsUrl, setTermsUrl] = useState("");
  const [sendCompletionEmail, setSendCompletionEmail] = useState(true);

  const [template, setTemplate] = useState("none");
  const [introVideo, setIntroVideo] = useState(null);
  const introVideoRef = useRef(null);

  const [startText, setStartText] = useState("Start Pouring");
  const [startTextColor, setStartTextColor] = useState("#ffffff");
  const [startBgColor, setStartBgColor] = useState("#6C4CE0");

  const [savedPulse, setSavedPulse] = useState(false);

  const [thanksBgImage, setThanksBgImage] = useState(null);
  const [thanksHeading, setThanksHeading] = useState("Yay! You completed the game!");
  const [thanksHeadingColor, setThanksHeadingColor] = useState("#1a1a2e");
  const [submitBtnText, setSubmitBtnText] = useState("Submit & Explore");
  const [submitBtnTextColor, setSubmitBtnTextColor] = useState("#ffffff");
  const [submitBtnBgColor, setSubmitBtnBgColor] = useState("#6366F1");
  const [submitGif, setSubmitGif] = useState(null);
  const submitGifRef = useRef(null);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [continueBtnText, setContinueBtnText] = useState("Continue Now");
  const [continueTextColor, setContinueTextColor] = useState("#ffffff");
  const [continueBgColor, setContinueBgColor] = useState("#6366F1");

  const [enableEmailNotifications, setEnableEmailNotifications] = useState(false);
  const [sendOnCompletion, setSendOnCompletion] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [emailSubject, setEmailSubject] = useState("Thanks for playing {{game_name}}!");
  const [emailHeaderText, setEmailHeaderText] = useState("Congratulations!");
  const [emailHeaderColor, setEmailHeaderColor] = useState("#6366F1");
  const [emailBodyHtml, setEmailBodyHtml] = useState(
    "<p>Hi {{name}},</p><p>You scored {{score}}/{{total}} on {{game_name}}!</p>"
  );
  const [emailFooterText, setEmailFooterText] = useState("© Your Company");

  const [sounds, setSounds] = useState([]);
  const soundUploadRef = useRef(null);
  const [soundAssignments, setSoundAssignments] = useState({
    cardFlip: "",
    match: "",
    noMatch: "",
    win: "",
  });
  function assignSound(event, soundId) {
    setSoundAssignments((a) => ({ ...a, [event]: soundId }));
  }

  const [gameSlug, setGameSlug] = useState("memory-match");
  const [settingsBgColor, setSettingsBgColor] = useState("#F8F8FF");
  const [settingsPrimaryColor, setSettingsPrimaryColor] = useState("#6366F1");
  const [selectedFont, setSelectedFont] = useState("DM Sans");
  const [metaDescription, setMetaDescription] = useState("");

  useEffect(() => {
    const families = FONT_CATEGORIES.flatMap((c) => c.fonts)
      .map((f) => "family=" + f.replace(/ /g, "+") + ":wght@400;700")
      .join("&");
    const href = "https://fonts.googleapis.com/css2?" + families + "&display=swap";
    if (!document.querySelector('link[data-gb-fonts="1"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-gb-fonts", "1");
      document.head.appendChild(link);
    }
  }, []);

  function saveAll() {
    setSavedPulse(true);
    setTimeout(() => setSavedPulse(false), 1400);
  }

  return (
    <div className="gb-root">
      <style>{`
        .gb-root{
          --pink:#D6339F; --purple:#6C4CE0; --purple-dark:#5638C4;
          --ink:#1F2430; --sub:#6B7280; --line:#E6E7EC; --panel:#FFFFFF; --page:#F3F4F8;
          --danger:#EF4444;
          font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
          background:var(--page); color:var(--ink); min-height:100vh; width:100%;
        }
        .gb-root *{ box-sizing:border-box; }
        .gb-topnav{ display:flex; align-items:center; gap:26px; padding:0 24px; height:48px; background:#fff; border-bottom:1px solid var(--line); overflow-x:auto; }
        .gb-tab{ display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600; color:var(--sub); background:none; border:none; cursor:pointer; padding:6px 2px; white-space:nowrap; position:relative; }
        .gb-tab.active{ color:var(--pink); }
        .gb-tab.active::after{ content:""; position:absolute; left:0; right:0; bottom:-13px; height:2px; background:var(--pink); }
        .gb-body{ display:flex; gap:20px; padding:24px; align-items:flex-start; max-width:1240px; margin:0 auto; }
        .gb-left{ flex:1; min-width:0; display:flex; flex-direction:column; gap:16px; }
        .gb-card{ background:var(--panel); border:1px solid var(--line); border-radius:12px; padding:18px 20px; }
        .gb-card-head{ display:flex; align-items:center; gap:7px; font-size:12px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--pink); margin-bottom:14px; }
        .gb-row2{ display:grid; grid-template-columns:1fr 1fr; gap:20px; }
        .gb-row3{ display:grid; grid-template-columns:1fr auto auto; gap:20px; align-items:start; }
        .gb-email-highlight{ background:#F0FBF4; border:1px solid #BBEBCB; border-radius:10px; padding:12px 14px; margin-bottom:14px; }
        .gb-email-notice{ display:flex; align-items:center; gap:6px; flex-wrap:wrap; background:#FFF9E6; border:1px solid #F5DE9B; border-radius:10px; padding:10px 14px; font-size:12px; color:#8A6D1D; margin-bottom:16px; }
        .gb-email-notice code{ background:#FFF1C2; border-radius:5px; padding:1px 5px; font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:11px; }
        .gb-font-category{ font-size:11.5px; font-weight:700; color:var(--pink); margin-bottom:8px; }
        .gb-font-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .gb-font-btn{ display:flex; flex-direction:column; align-items:flex-start; gap:3px; text-align:left; border:1px solid var(--line); border-radius:9px; padding:9px 11px; background:#FAFAFC; cursor:pointer; }
        .gb-font-btn.active{ border-color:var(--purple); background:#FAF9FF; box-shadow:0 0 0 2px rgba(108,76,224,0.12); }
        .gb-font-name{ font-size:13px; font-weight:700; color:var(--ink); line-height:1.2; }
        .gb-font-sample{ font-size:11px; color:var(--sub); line-height:1.2; }
        .gb-field{ margin-bottom:14px; }
        .gb-field:last-child{ margin-bottom:0; }
        .gb-label{ display:block; font-size:10.5px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--sub); margin-bottom:6px; }
        .gb-input, .gb-select, .gb-textarea{ width:100%; border:1px solid var(--line); border-radius:8px; padding:9px 11px; font-size:13.5px; color:var(--ink); background:#fff; }
        .gb-input:focus, .gb-select:focus, .gb-textarea:focus{ outline:none; border-color:var(--purple); box-shadow:0 0 0 3px rgba(108,76,224,0.12); }
        .gb-textarea{ resize:vertical; min-height:56px; font-family:inherit; }
        .gb-field-with-swatch{ display:flex; align-items:center; gap:10px; }
        .gb-field-with-swatch .gb-input{ flex:1; }
        .gb-swatch{ display:flex; align-items:center; gap:6px; border:1px solid var(--line); border-radius:8px; padding:5px 8px; }
        .gb-swatch-input{ width:18px; height:18px; border:none; padding:0; background:none; cursor:pointer; }
        .gb-swatch-hex-input{ width:72px; border:1px solid var(--line); border-radius:6px; padding:4px 6px; font-size:12px; color:var(--ink); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; background:#fff; }
        .gb-swatch-hex-input:focus{ outline:none; border-color:var(--purple); box-shadow:0 0 0 2px rgba(108,76,224,0.12); }
        .gb-uploader{ }
        .gb-uploader-label{ font-size:10.5px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--sub); margin-bottom:8px; text-align:center; }
        .gb-uploader-box{ height:64px; border:1.5px dashed var(--line); border-radius:10px; display:flex; align-items:center; justify-content:center; gap:6px; font-size:12.5px; color:var(--sub); cursor:pointer; background:#FAFAFC; overflow:hidden; }
        .gb-uploader-box:hover{ border-color:var(--purple); color:var(--purple); }
        .gb-uploader-preview{ width:100%; height:100%; object-fit:cover; }
        .gb-hint{ font-size:12px; color:var(--sub); margin:2px 0 14px; }
        .gb-bgpresets{ display:flex; gap:10px; flex-wrap:wrap; }
        .gb-bgswatch{ width:44px; height:44px; border-radius:10px; border:2px solid transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:0; }
        .gb-bgswatch.active{ border-color:var(--purple); box-shadow:0 0 0 2px rgba(108,76,224,0.18); }
        .gb-designs{ display:grid; grid-template-columns:repeat(5,1fr); gap:8px; }
        .gb-design{ position:relative; display:flex; flex-direction:column; align-items:center; gap:6px; padding:10px 4px 8px; border:1px solid var(--line); border-radius:10px; background:#FAFAFC; cursor:pointer; }
        .gb-design.active{ border-color:var(--purple); background:#FAF9FF; }
        .gb-design span{ font-size:10px; font-weight:600; color:var(--sub); text-align:center; line-height:1.2; }
        .gb-design.active span{ color:var(--purple); }
        .gb-design-check{ position:absolute; top:-6px; right:-6px; width:16px; height:16px; border-radius:50%; background:var(--purple); color:#fff; display:flex; align-items:center; justify-content:center; }
        .gb-bottles{ display:flex; flex-direction:column; gap:10px; }
        .gb-bottle{ display:flex; align-items:center; gap:10px; padding:8px 10px; border:1px solid var(--line); border-radius:10px; flex-wrap:wrap; }
        .gb-bottle.active{ border-color:var(--purple); background:#FAF9FF; }
        .gb-bottle-select{ position:relative; width:34px; height:34px; border-radius:8px; border:1px solid var(--line); padding:0; cursor:pointer; flex:none; }
        .gb-bottle-glass{ position:absolute; inset:0; border-radius:7px; }
        .gb-bottle-check{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#fff; background:rgba(0,0,0,0.18); border-radius:7px; }
        .gb-bottle-name{ flex:1; min-width:110px; border:none; background:none; font-size:13px; font-weight:600; color:var(--ink); padding:6px 2px; }
        .gb-bottle-name:focus{ outline:none; border-bottom:1px solid var(--purple); }
        .gb-bottle-edit{ width:30px; height:30px; border-radius:8px; border:1px solid var(--line); background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--sub); flex:none; }
        .gb-bottle-edit:hover{ color:var(--purple); border-color:var(--purple); }
        .gb-bottle-colors{ display:flex; gap:16px; width:100%; padding-top:8px; border-top:1px solid var(--line); margin-top:4px; }
        .gb-fieldrow{ display:grid; grid-template-columns:1fr 150px auto auto; gap:14px; align-items:end; padding:12px 0; border-bottom:1px solid var(--line); }
        .gb-fieldrow:last-of-type{ border-bottom:none; }
        .gb-check-wrap{ display:flex; align-items:center; gap:6px; padding-bottom:9px; }
        .gb-check-wrap label{ font-size:12.5px; color:var(--sub); font-weight:600; }
        .gb-icon-btn{ width:34px; height:34px; border-radius:8px; border:1px solid var(--line); background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--danger); }
        .gb-icon-btn:hover{ background:#FEF2F2; border-color:#FCA5A5; }
        .gb-fieldbar{ display:flex; justify-content:center; gap:10px; margin-top:16px; }
        .gb-btn{ display:inline-flex; align-items:center; gap:7px; font-size:13px; font-weight:700; border-radius:9px; padding:9px 16px; border:1px solid var(--line); background:#fff; color:var(--ink); cursor:pointer; }
        .gb-btn:hover{ background:#F7F7FA; }
        .gb-btn-primary{ background:linear-gradient(180deg,#7C5CFC,var(--purple-dark)); border:none; color:#fff; }
        .gb-btn-primary:hover{ filter:brightness(1.05); }
        .gb-checkbox-row{ display:flex; align-items:center; gap:8px; margin-bottom:14px; font-size:13px; font-weight:600; }
        .gb-checkbox-row input{ width:15px; height:15px; accent-color:var(--purple); }
        .gb-select-wrap select{ appearance:none; }
        .gb-manage-btn{ margin-top:10px; font-size:12.5px; padding:7px 12px; }
        .gb-savebar{ display:flex; justify-content:flex-end; padding-top:4px; }
        .gb-saved-msg{ font-size:12.5px; color:#059669; font-weight:700; align-self:center; margin-right:12px; }

        .gb-right{ position:sticky; top:24px; width:300px; flex:none; display:flex; justify-content:center; }
        .gb-phone{ width:270px; height:560px; border:9px solid #17171c; border-radius:40px; background:#000; position:relative; box-shadow:0 20px 44px rgba(20,10,50,.18); overflow:hidden; }
        .gb-phone-notch{ position:absolute; top:9px; left:50%; transform:translateX(-50%); width:90px; height:20px; background:#17171c; border-radius:0 0 14px 14px; z-index:5; }
        .gb-phone-screen{ position:absolute; inset:0; border-radius:31px; overflow:hidden; background-size:cover; background-position:center; display:flex; flex-direction:column; }
        .gb-phone-logo{ display:flex; justify-content:center; padding-top:34px; }
        .gb-phone-logo img{ width:34px; height:34px; border-radius:9px; object-fit:cover; }
        .gb-phone-content{ flex:1; display:flex; flex-direction:column; align-items:center; padding:14px 20px 20px; overflow-y:auto; }
        .gb-phone-title{ font-size:17px; font-weight:800; text-align:center; margin:6px 0 4px; line-height:1.25; }
        .gb-phone-sub{ font-size:11.5px; text-align:center; opacity:.85; margin-bottom:8px; line-height:1.4; }
        .gb-phone-intro{ font-size:10.5px; text-align:center; line-height:1.5; margin-bottom:16px; opacity:.85; }
        .gb-phone-form{ width:100%; display:flex; flex-direction:column; gap:9px; margin-top:auto; }
        .gb-phone-flabel{ font-size:8.5px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; opacity:.65; margin-bottom:3px; }
        .gb-phone-finput{ width:100%; border:1px solid rgba(0,0,0,0.12); border-radius:8px; padding:8px 9px; font-size:11px; background:rgba(255,255,255,0.9); color:#333; }
        .gb-phone-terms{ display:flex; align-items:center; gap:6px; font-size:9.5px; opacity:.75; margin-top:2px; }
        .gb-phone-start{ width:100%; border:none; border-radius:9px; padding:11px; font-size:12.5px; font-weight:800; margin-top:8px; cursor:default; }
        .gb-phone-tag{ display:flex; align-items:center; justify-content:center; gap:5px; font-size:9px; color:#fff; opacity:.55; padding:8px 0 12px; }
      `}</style>

      <div className="gb-topnav">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              className={"gb-tab" + (activeTab === t.id ? " active" : "")}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon size={13} strokeWidth={2} />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === "settings" ? (
        <div className="gb-body">
          <div className="gb-left">
            <div className="gb-card">
              <div className="gb-card-head"><LinkIcon size={13} /> URL Slug & Colors</div>
              <div className="gb-field">
                <label className="gb-label">Game URL Slug</label>
                <input
                  className="gb-input"
                  value={gameSlug}
                  onChange={(e) => setGameSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                />
                <p className="gb-hint" style={{ marginTop: 6, marginBottom: 0 }}>
                  /play/{gameSlug || "your-slug"}/promogames
                </p>
              </div>
              <div className="gb-row2" style={{ marginTop: 14 }}>
                <div className="gb-field">
                  <label className="gb-label">Background Color</label>
                  <ColorSwatch value={settingsBgColor} onChange={setSettingsBgColor} />
                </div>
                <div className="gb-field">
                  <label className="gb-label">Primary Color</label>
                  <ColorSwatch value={settingsPrimaryColor} onChange={setSettingsPrimaryColor} />
                </div>
              </div>
            </div>

            <div className="gb-card">
              <div className="gb-card-head"><Type size={13} /> Font Family</div>
              <p className="gb-hint">Selected: {selectedFont}</p>
              {FONT_CATEGORIES.map((cat) => (
                <div key={cat.name} style={{ marginBottom: 16 }}>
                  <div className="gb-font-category">{cat.emoji} {cat.name}</div>
                  <div className="gb-font-grid">
                    {cat.fonts.map((f) => (
                      <button
                        key={f}
                        type="button"
                        className={"gb-font-btn" + (selectedFont === f ? " active" : "")}
                        onClick={() => setSelectedFont(f)}
                        style={{ fontFamily: `'${f}', ${cat.stack}` }}
                      >
                        <span className="gb-font-name">{f}</span>
                        <span className="gb-font-sample">The quick brown fox</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="gb-card">
              <div className="gb-card-head"><Share2 size={13} /> Social Share Preview</div>
              <div className="gb-field">
                <label className="gb-label">Meta Description</label>
                <textarea
                  className="gb-textarea"
                  value={metaDescription}
                  maxLength={100}
                  placeholder="Brief description for social sharing…"
                  onChange={(e) => setMetaDescription(e.target.value)}
                />
                <p className="gb-hint" style={{ textAlign: "right", marginTop: 4, marginBottom: 0 }}>
                  {metaDescription.length}/100
                </p>
              </div>
            </div>

            <div className="gb-savebar">
              <span className="gb-saved-msg" style={{ opacity: savedPulse ? 1 : 0, transition: "opacity .3s" }}>Saved</span>
              <button className="gb-btn gb-btn-primary" onClick={saveAll}><Save size={14} /> Save Settings</button>
            </div>
          </div>

          <div className="gb-right">
            <div className="gb-phone">
              <div className="gb-phone-notch" />
              <div className="gb-phone-screen" style={{ background: settingsBgColor }}>
                <div className="gb-phone-content">
                  <div className="gb-phone-title" style={{ color: "var(--ink)", marginTop: 30, fontFamily: `'${selectedFont}', sans-serif` }}>
                    {title || "Untitled"}
                  </div>
                  <div className="gb-phone-form">
                    {fields.map((f) => (
                      <div key={f.id}>
                        <div className="gb-phone-finput" style={{ color: "var(--sub)", fontFamily: `'${selectedFont}', sans-serif` }}>
                          {f.label || "Untitled field"}{f.required ? " *" : ""}
                        </div>
                      </div>
                    ))}
                    <button
                      className="gb-phone-start"
                      style={{ background: settingsPrimaryColor, color: "#fff", fontFamily: `'${selectedFont}', sans-serif` }}
                    >
                      {startText || "Start"} &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "audio" ? (
        <div className="gb-body">
          <div className="gb-left">
            <div className="gb-card">
              <div className="gb-card-head"><Volume2 size={13} /> Sound Library</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <button
                  className="gb-btn"
                  onClick={() => soundUploadRef.current && soundUploadRef.current.click()}
                  type="button"
                >
                  <Music size={13} /> Upload Sound
                </button>
                <span className="gb-hint" style={{ margin: 0 }}>MP3, WAV, or OGG</span>
                <input
                  ref={soundUploadRef}
                  type="file"
                  accept=".mp3,.wav,.ogg,audio/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) {
                      setSounds((ss) => [...ss, ...files.map((f) => ({ id: uid(), name: f.name }))]);
                    }
                  }}
                />
              </div>

              <div className="gb-card-head">Assign Sounds</div>
              <div className="gb-row2">
                <div className="gb-field">
                  <label className="gb-label" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <LayoutGrid size={11} /> Card Flip
                  </label>
                  <select
                    className="gb-select"
                    value={soundAssignments.cardFlip}
                    onChange={(e) => assignSound("cardFlip", e.target.value)}
                  >
                    <option value="">— None —</option>
                    {sounds.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="gb-field">
                  <label className="gb-label" style={{ display: "flex", alignItems: "center", gap: 5, color: "#059669" }}>
                    <CheckCircle2 size={11} /> Match
                  </label>
                  <select
                    className="gb-select"
                    value={soundAssignments.match}
                    onChange={(e) => assignSound("match", e.target.value)}
                  >
                    <option value="">— None —</option>
                    {sounds.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="gb-field">
                  <label className="gb-label" style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--danger)" }}>
                    <XCircle size={11} /> No Match
                  </label>
                  <select
                    className="gb-select"
                    value={soundAssignments.noMatch}
                    onChange={(e) => assignSound("noMatch", e.target.value)}
                  >
                    <option value="">— None —</option>
                    {sounds.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="gb-field">
                  <label className="gb-label" style={{ display: "flex", alignItems: "center", gap: 5, color: "#B45309" }}>
                    <Trophy size={11} /> Win
                  </label>
                  <select
                    className="gb-select"
                    value={soundAssignments.win}
                    onChange={(e) => assignSound("win", e.target.value)}
                  >
                    <option value="">— None —</option>
                    {sounds.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <button className="gb-btn gb-btn-primary" style={{ marginTop: 16 }} onClick={saveAll}>
                <Save size={14} /> Save Sound Assignments
              </button>
            </div>

            {sounds.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--sub)" }}>
                <Music size={30} strokeWidth={1.5} color="#C7C9D6" />
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 10 }}>No sounds uploaded yet</div>
                <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>Upload MP3, WAV, or OGG files above</div>
              </div>
            ) : (
              <div className="gb-card">
                <div className="gb-card-head"><Music size={13} /> Uploaded Sounds</div>
                <div className="gb-bottles">
                  {sounds.map((s) => (
                    <div className="gb-bottle" key={s.id}>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                      <button
                        className="gb-icon-btn"
                        onClick={() => setSounds((ss) => ss.filter((x) => x.id !== s.id))}
                        aria-label="Remove sound"
                        type="button"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="gb-right">
            <div className="gb-phone">
              <div className="gb-phone-notch" />
              <div className="gb-phone-screen" style={{ background: "#fff" }}>
                <div className="gb-phone-content">
                  <div className="gb-phone-title" style={{ color: "var(--ink)", marginTop: 30 }}>{title || "Untitled"}</div>
                  <div className="gb-phone-form">
                    {fields.map((f) => (
                      <div key={f.id}>
                        <div className="gb-phone-finput" style={{ color: "var(--sub)" }}>
                          {f.label || "Untitled field"}{f.required ? " *" : ""}
                        </div>
                      </div>
                    ))}
                    <button
                      className="gb-phone-start"
                      style={{ background: startBgColor, color: startTextColor }}
                    >
                      {startText || "Start"} &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "email" ? (
        <div className="gb-body">
          <div className="gb-left">
            <div className="gb-card">
              <div className="gb-checkbox-row">
                <input type="checkbox" checked={enableEmailNotifications} onChange={(e) => setEnableEmailNotifications(e.target.checked)} id="enablemail" />
                <label htmlFor="enablemail">Enable email notifications</label>
              </div>
              <div className="gb-email-highlight">
                <div className="gb-checkbox-row" style={{ marginBottom: 0, justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" checked={sendOnCompletion} onChange={(e) => setSendOnCompletion(e.target.checked)} id="sendoncomplete" />
                    <label htmlFor="sendoncomplete" style={{ color: "var(--ink)" }}>Send email on game completion</label>
                  </div>
                  <span className="gb-hint" style={{ margin: 0 }}>Requires template below to be enabled</span>
                </div>
              </div>

              <div className="gb-email-notice">
                <HelpCircle size={13} /> Available placeholders: <code>{"{{name}}"}</code> <code>{"{{score}}"}</code> <code>{"{{total}}"}</code> <code>{"{{game_name}}"}</code>
              </div>

              <div className="gb-row2">
                <div className="gb-field">
                  <label className="gb-label">Sender Name</label>
                  <input className="gb-input" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                </div>
                <div className="gb-field">
                  <label className="gb-label">Sender Email</label>
                  <input className="gb-input" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} />
                </div>
              </div>

              <div className="gb-field">
                <label className="gb-label">Subject</label>
                <input className="gb-input" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
              </div>

              <div className="gb-row2">
                <div className="gb-field">
                  <label className="gb-label">Header Text</label>
                  <input className="gb-input" value={emailHeaderText} onChange={(e) => setEmailHeaderText(e.target.value)} />
                </div>
                <div className="gb-field">
                  <label className="gb-label">Header Color</label>
                  <ColorSwatch value={emailHeaderColor} onChange={setEmailHeaderColor} />
                </div>
              </div>

              <div className="gb-field">
                <label className="gb-label">Body HTML</label>
                <textarea className="gb-textarea" style={{ minHeight: 90 }} value={emailBodyHtml} onChange={(e) => setEmailBodyHtml(e.target.value)} />
              </div>

              <div className="gb-field">
                <label className="gb-label">Footer Text</label>
                <input className="gb-input" value={emailFooterText} onChange={(e) => setEmailFooterText(e.target.value)} />
              </div>
            </div>

            <div className="gb-savebar">
              <span className="gb-saved-msg" style={{ opacity: savedPulse ? 1 : 0, transition: "opacity .3s" }}>Saved</span>
              <button className="gb-btn gb-btn-primary" onClick={saveAll}><Save size={14} /> Save Email Template</button>
            </div>
          </div>

          <div className="gb-right">
            <div className="gb-phone">
              <div className="gb-phone-notch" />
              <div className="gb-phone-screen" style={{ background: "#EDEDF3" }}>
                <div style={{ background: emailHeaderColor, color: "#fff", fontWeight: 800, fontSize: 15, textAlign: "center", padding: "34px 16px 14px" }}>
                  {emailHeaderText || "Header"}
                </div>
                <div style={{ background: "#fff", margin: 14, borderRadius: 10, padding: "14px 12px", fontSize: 11.5, color: "var(--ink)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                  Thanks for playing
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "thanks" ? (
        <div className="gb-body">
          <div className="gb-left">
            <div className="gb-row2">
              <div className="gb-card">
                <div className="gb-card-head"><ImageIcon size={13} /> Background</div>
                <ImageUploader label="Thank You Background" value={thanksBgImage} onChange={setThanksBgImage} />
              </div>

              <div className="gb-card">
                <div className="gb-card-head"><PartyPopper size={13} /> Thank You Message</div>
                <div className="gb-field">
                  <label className="gb-label">Heading</label>
                  <textarea className="gb-textarea" value={thanksHeading} onChange={(e) => setThanksHeading(e.target.value)} />
                </div>
                <div className="gb-field">
                  <label className="gb-label">Heading Color</label>
                  <ColorSwatch value={thanksHeadingColor} onChange={setThanksHeadingColor} />
                </div>
              </div>
            </div>

            <div className="gb-card">
              <div className="gb-card-head"><Rocket size={13} /> Submit Button</div>
              <div className="gb-row3">
                <div className="gb-field">
                  <label className="gb-label">Button Text</label>
                  <input className="gb-input" value={submitBtnText} onChange={(e) => setSubmitBtnText(e.target.value)} />
                </div>
                <div className="gb-field">
                  <label className="gb-label">Text Color</label>
                  <ColorSwatch value={submitBtnTextColor} onChange={setSubmitBtnTextColor} />
                </div>
                <div className="gb-field">
                  <label className="gb-label">BG Color</label>
                  <ColorSwatch value={submitBtnBgColor} onChange={setSubmitBtnBgColor} />
                </div>
              </div>
            </div>

            <div className="gb-row2">
              <div className="gb-card">
                <div className="gb-card-head"><ImageIcon size={13} /> Submit Confirmation GIF</div>
                <button className="gb-btn gb-manage-btn" onClick={() => submitGifRef.current && submitGifRef.current.click()}>
                  <Upload size={13} /> Upload
                </button>
                <input
                  ref={submitGifRef}
                  type="file"
                  accept="image/gif,image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files && e.target.files[0];
                    if (f) setSubmitGif(f.name);
                  }}
                />
                {submitGif && <div className="gb-hint" style={{ marginTop: 8, marginBottom: 0 }}>{submitGif}</div>}
              </div>

              <div className="gb-card">
                <div className="gb-card-head" style={{ color: "var(--purple)" }}><Rocket size={13} /> Redirect & Continue</div>
                <div className="gb-field">
                  <label className="gb-label">Redirect URL</label>
                  <input className="gb-input" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://yoursite.com/thankyou" />
                </div>
                <div className="gb-field">
                  <label className="gb-label">Continue Button Text</label>
                  <input className="gb-input" value={continueBtnText} onChange={(e) => setContinueBtnText(e.target.value)} />
                </div>
                <div className="gb-row2">
                  <div className="gb-field">
                    <label className="gb-label">Text Color</label>
                    <ColorSwatch value={continueTextColor} onChange={setContinueTextColor} />
                  </div>
                  <div className="gb-field">
                    <label className="gb-label">BG Color</label>
                    <ColorSwatch value={continueBgColor} onChange={setContinueBgColor} />
                  </div>
                </div>
              </div>
            </div>

            <div className="gb-savebar">
              <span className="gb-saved-msg" style={{ opacity: savedPulse ? 1 : 0, transition: "opacity .3s" }}>Saved</span>
              <button className="gb-btn gb-btn-primary" onClick={saveAll}><Save size={14} /> Save Settings</button>
            </div>
          </div>

          <div className="gb-right">
            <div className="gb-phone">
              <div className="gb-phone-notch" />
              <div
                className="gb-phone-screen"
                style={{
                  background: thanksBgImage ? `url(${thanksBgImage}) center/cover` : "#F5F5FA",
                }}
              >
                <div className="gb-phone-content" style={{ justifyContent: "space-between" }}>
                  <div style={{ marginTop: 40, textAlign: "center" }}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>🎉</div>
                    <div className="gb-phone-title" style={{ color: thanksHeadingColor }}>{thanksHeading || "Untitled"}</div>
                  </div>
                  <button
                    className="gb-phone-start"
                    style={{ background: submitBtnBgColor, color: submitBtnTextColor, marginBottom: 20 }}
                  >
                    {submitBtnText || "Submit"} &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab !== "player" ? (
        <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--sub)", fontSize: 14 }}>
          The {TABS.find((t) => t.id === activeTab).label} section isn't wired up yet — this preview only builds out Player Form and Thank You Page.
        </div>
      ) : (
        <div className="gb-body">
          <div className="gb-left">
            <div className="gb-card">
              <div className="gb-card-head"><ImageIcon size={13} /> Visuals</div>
              <div className="gb-row2">
                <ImageUploader label="Game Background Image" value={bgImage} onChange={setBgImage} />
                <ImageUploader label="Game Logo" value={logoImage} onChange={setLogoImage} />
              </div>

              <div className="gb-field" style={{ marginTop: 16 }}>
                <label className="gb-label">Background Theme (used when no image is uploaded)</label>
                <div className="gb-bgpresets">
                  {BACKGROUND_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      className={"gb-bgswatch" + (bgPresetId === p.id && !bgImage ? " active" : "")}
                      style={{ background: p.css }}
                      onClick={() => { setBgPresetId(p.id); setBgImage(null); }}
                      title={p.name}
                      type="button"
                    >
                      {bgPresetId === p.id && !bgImage && <Check size={13} color="#fff" strokeWidth={3} />}
                    </button>
                  ))}
                  <button
                    className={"gb-bgswatch" + (bgPresetId === "custom" && !bgImage ? " active" : "")}
                    style={{ background: `linear-gradient(180deg, ${customBgTop}, ${customBgBottom})` }}
                    onClick={() => { setBgPresetId("custom"); setBgImage(null); }}
                    title="Custom"
                    type="button"
                  >
                    {bgPresetId === "custom" && !bgImage && <Check size={13} color="#fff" strokeWidth={3} />}
                  </button>
                </div>
                {bgImage && <p className="gb-hint" style={{ marginBottom: 0 }}>An uploaded image is active — remove it to use a theme instead.</p>}
                {bgImage && (
                  <button className="gb-btn" style={{ marginTop: 8 }} onClick={() => setBgImage(null)}>Remove uploaded image</button>
                )}
                <div className="gb-row2" style={{ marginTop: 12 }}>
                  <div>
                    <label className="gb-label">Custom Top Color</label>
                    <ColorSwatch value={customBgTop} onChange={(v) => { setCustomBgTop(v); setBgPresetId("custom"); setBgImage(null); }} />
                  </div>
                  <div>
                    <label className="gb-label">Custom Bottom Color</label>
                    <ColorSwatch value={customBgBottom} onChange={(v) => { setCustomBgBottom(v); setBgPresetId("custom"); setBgImage(null); }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="gb-card">
              <div className="gb-card-head"><GlassWater size={13} /> Bottles</div>
              <p className="gb-hint">Pick which bottle pours in the game, and tune each one's liquid colors.</p>

              <div className="gb-field">
                <label className="gb-label">Bottle Design</label>
                <div className="gb-designs">
                  {BOTTLE_DESIGNS.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={"gb-design" + (activeDesignId === d.id ? " active" : "")}
                      onClick={() => setActiveDesignId(d.id)}
                      title={d.name}
                    >
                      <svg width="22" height="38" viewBox={d.viewBox}>
                        <path d={d.d} fill={activeDesignId === d.id ? "var(--purple)" : "#C7C9D6"} />
                      </svg>
                      <span>{d.name}</span>
                      {activeDesignId === d.id && <span className="gb-design-check"><Check size={10} strokeWidth={3} /></span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gb-bottles">
                {bottles.map((b) => (
                  <div key={b.id} className={"gb-bottle" + (activeBottleId === b.id ? " active" : "")}>
                    <button
                      type="button"
                      className="gb-bottle-select"
                      onClick={() => setActiveBottleId(b.id)}
                      title={"Use " + b.name}
                    >
                      <svg width="34" height="34" viewBox={(BOTTLE_DESIGNS.find((d) => d.id === activeDesignId) || BOTTLE_DESIGNS[0]).viewBox} style={{ position: "absolute", inset: 0 }}>
                        <defs>
                          <linearGradient id={"grad-" + b.id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={b.liquidB} />
                            <stop offset="100%" stopColor={b.liquidA} />
                          </linearGradient>
                        </defs>
                        <path d={(BOTTLE_DESIGNS.find((d) => d.id === activeDesignId) || BOTTLE_DESIGNS[0]).d} fill={`url(#grad-${b.id})`} />
                      </svg>
                      {activeBottleId === b.id && <span className="gb-bottle-check"><Check size={11} strokeWidth={3} /></span>}
                    </button>
                    <input
                      className="gb-bottle-name"
                      value={b.name}
                      onChange={(e) => updateBottle(b.id, { name: e.target.value })}
                    />
                    <button
                      type="button"
                      className="gb-bottle-edit"
                      onClick={() => setEditingBottleId(editingBottleId === b.id ? null : b.id)}
                      title="Edit colors"
                    >
                      <Palette size={13} />
                    </button>
                    <button
                      type="button"
                      className="gb-bottle-edit"
                      onClick={() => removeBottle(b.id)}
                      title="Remove bottle"
                      style={{ color: "var(--danger)" }}
                    >
                      <Trash2 size={13} />
                    </button>
                    {editingBottleId === b.id && (
                      <div className="gb-bottle-colors">
                        <div>
                          <label className="gb-label">Top Color</label>
                          <ColorSwatch value={b.liquidB} onChange={(v) => updateBottle(b.id, { liquidB: v })} />
                        </div>
                        <div>
                          <label className="gb-label">Bottom Color</label>
                          <ColorSwatch value={b.liquidA} onChange={(v) => updateBottle(b.id, { liquidA: v })} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button className="gb-btn" style={{ marginTop: 12 }} onClick={addBottle} type="button">
                <Plus size={14} /> Add Bottle
              </button>
            </div>

            <div className="gb-card">
              <div className="gb-card-head"><Type size={13} /> Game Texts</div>
              <div className="gb-field">
                <label className="gb-label">Heading 1 (Title — text 1)</label>
                <div className="gb-field-with-swatch">
                  <input className="gb-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Main title" />
                  <ColorSwatch value={titleColor} onChange={setTitleColor} />
                </div>
              </div>
              <div className="gb-field">
                <label className="gb-label">Heading 2 (Subtitle — text 2)</label>
                <div className="gb-field-with-swatch">
                  <input className="gb-input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Sub-heading" />
                  <ColorSwatch value={subtitleColor} onChange={setSubtitleColor} />
                </div>
              </div>
              <div className="gb-field">
                <label className="gb-label">Intro Text (body — text 3, shown before quiz)</label>
                <div className="gb-field-with-swatch" style={{ alignItems: "flex-start" }}>
                  <textarea className="gb-textarea" value={introText} onChange={(e) => setIntroText(e.target.value)} />
                  <ColorSwatch value={introColor} onChange={setIntroColor} />
                </div>
              </div>
            </div>

            <div className="gb-card">
              <div className="gb-card-head"><ListChecks size={13} /> Player Registration Fields</div>
              <p className="gb-hint">These fields appear on the player registration screen before the pour starts.</p>
              {fields.map((f) => (
                <div className="gb-fieldrow" key={f.id}>
                  <div>
                    <label className="gb-label">Label</label>
                    <input
                      className="gb-input"
                      value={f.label}
                      onChange={(e) => updateField(f.id, { label: e.target.value })}
                      placeholder="Field label"
                    />
                  </div>
                  <div>
                    <label className="gb-label">Type</label>
                    <select
                      className="gb-select"
                      value={f.type}
                      onChange={(e) => updateField(f.id, { type: e.target.value })}
                    >
                      {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="gb-check-wrap">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) => updateField(f.id, { required: e.target.checked })}
                      id={"req-" + f.id}
                    />
                    <label htmlFor={"req-" + f.id}>Required</label>
                  </div>
                  <button className="gb-icon-btn" onClick={() => removeField(f.id)} aria-label="Remove field">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <div className="gb-fieldbar">
                <button className="gb-btn" onClick={addField}><Plus size={14} /> Add Field</button>
                <button className="gb-btn gb-btn-primary" onClick={saveAll}><Save size={14} /> Save Form</button>
              </div>
            </div>

            <div className="gb-row2">
              <div className="gb-card">
                <div className="gb-card-head"><FileText size={13} /> Terms & Conditions</div>
                <div className="gb-checkbox-row">
                  <input type="checkbox" checked={requireTerms} onChange={(e) => setRequireTerms(e.target.checked)} id="reqterms" />
                  <label htmlFor="reqterms">Require acceptance</label>
                </div>
                <div className="gb-field">
                  <label className="gb-label">Label Text</label>
                  <input className="gb-input" value={termsLabel} onChange={(e) => setTermsLabel(e.target.value)} />
                </div>
                <div className="gb-field">
                  <label className="gb-label">URL (optional)</label>
                  <input className="gb-input" value={termsUrl} onChange={(e) => setTermsUrl(e.target.value)} placeholder="https://yoursite.com/terms" />
                </div>
                <div className="gb-checkbox-row" style={{ marginTop: 4 }}>
                  <input type="checkbox" checked={sendCompletionEmail} onChange={(e) => setSendCompletionEmail(e.target.checked)} id="sendmail" />
                  <label htmlFor="sendmail">Send completion email</label>
                </div>

                <div className="gb-card-head" style={{ marginTop: 18 }}><Rocket size={13} /> Start Button</div>
                <div className="gb-field">
                  <label className="gb-label">Button Text</label>
                  <input className="gb-input" value={startText} onChange={(e) => setStartText(e.target.value)} />
                </div>
                <div className="gb-row2">
                  <div className="gb-field">
                    <label className="gb-label">Text Color</label>
                    <ColorSwatch value={startTextColor} onChange={setStartTextColor} />
                  </div>
                  <div className="gb-field">
                    <label className="gb-label">Background Color</label>
                    <ColorSwatch value={startBgColor} onChange={setStartBgColor} />
                  </div>
                </div>
              </div>

              <div className="gb-card">
                <div className="gb-card-head"><Video size={13} /> Template & Intro Video</div>
                <div className="gb-field">
                  <label className="gb-label">Apply Template (skin / animations / voice)</label>
                  <select className="gb-select" value={template} onChange={(e) => setTemplate(e.target.value)}>
                    <option value="none">— No template (manual settings) —</option>
                    <option value="citrus">Citrus Splash</option>
                    <option value="tropical">Tropical Fizz</option>
                    <option value="midnight">Midnight Pour</option>
                  </select>
                  <button className="gb-btn gb-manage-btn">Manage Templates</button>
                </div>
                <div className="gb-field">
                  <label className="gb-label">Intro Video (plays with audio before questions)</label>
                  <button className="gb-btn gb-manage-btn" onClick={() => introVideoRef.current && introVideoRef.current.click()}>
                    <Upload size={13} /> Upload
                  </button>
                  <input
                    ref={introVideoRef}
                    type="file"
                    accept="video/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (f) setIntroVideo(f.name);
                    }}
                  />
                  {introVideo && <div className="gb-hint" style={{ marginTop: 8, marginBottom: 0 }}>{introVideo}</div>}
                </div>
              </div>
            </div>

            <div className="gb-savebar">
              <span className="gb-saved-msg" style={{ opacity: savedPulse ? 1 : 0, transition: "opacity .3s" }}>Saved</span>
              <button className="gb-btn gb-btn-primary" onClick={saveAll}><Save size={14} /> Save Settings</button>
            </div>
          </div>

          <div className="gb-right">
            <div className="gb-phone">
              <div className="gb-phone-notch" />
              <div
                className="gb-phone-screen"
                style={{
                  background: bgImage
                    ? `url(${bgImage}) center/cover`
                    : bgPresetId === "custom"
                    ? `linear-gradient(180deg, ${customBgTop}, ${customBgBottom})`
                    : (BACKGROUND_PRESETS.find((p) => p.id === bgPresetId) || BACKGROUND_PRESETS[0]).css,
                }}
              >
                <div className="gb-phone-logo">
                  {logoImage ? <img src={logoImage} alt="logo" /> : <Smartphone size={26} strokeWidth={1.5} color="#9B8FD1" />}
                </div>
                <div className="gb-phone-content">
                  {(() => {
                    const activeBottle = bottles.find((b) => b.id === activeBottleId) || bottles[0];
                    const design = BOTTLE_DESIGNS.find((d) => d.id === activeDesignId) || BOTTLE_DESIGNS[0];
                    return (
                      <svg width="26" height="46" viewBox={design.viewBox} style={{ marginBottom: 6 }}>
                        <defs>
                          <linearGradient id="gb-bottle-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={activeBottle.liquidB} />
                            <stop offset="100%" stopColor={activeBottle.liquidA} />
                          </linearGradient>
                        </defs>
                        <path d={design.d} fill="url(#gb-bottle-grad)" opacity="0.95" />
                        <path d={design.d} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" />
                      </svg>
                    );
                  })()}
                  <div className="gb-phone-title" style={{ color: titleColor }}>{title || "Untitled"}</div>
                  <div className="gb-phone-sub" style={{ color: subtitleColor }}>{subtitle}</div>
                  <div className="gb-phone-intro" style={{ color: introColor }}>{introText}</div>

                  <div className="gb-phone-form">
                    {fields.map((f) => (
                      <div key={f.id}>
                        <div className="gb-phone-flabel">{f.label || "Untitled field"}{f.required ? " *" : ""}</div>
                        <div className="gb-phone-finput">{f.type === "Email" ? "name@email.com" : f.type === "Phone" ? "+1 555 000 0000" : "…"}</div>
                      </div>
                    ))}
                    {requireTerms && (
                      <div className="gb-phone-terms">
                        <input type="checkbox" disabled style={{ width: 11, height: 11 }} />
                        <span>I accept the {termsLabel || "Terms & Conditions"}</span>
                      </div>
                    )}
                    <button
                      className="gb-phone-start"
                      style={{ background: startBgColor, color: startTextColor }}
                    >
                      {startText || "Start"} &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
